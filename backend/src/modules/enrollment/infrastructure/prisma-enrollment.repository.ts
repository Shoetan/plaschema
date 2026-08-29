import { Injectable } from '@nestjs/common';
import { buildCursorPage } from '../../../platform/http/cursor-pagination';
import { toQueryInt } from '../../../platform/http/query-transforms';
import { PrismaService } from '../../../platform/persistence/prisma.service';
import type {
  Enrollment,
  EnrollmentListItem,
} from '../domain/enrollment';
import {
  enrollmentBeneficiaryName,
  formatEnrollmentId,
} from '../domain/enrollment-id';
import { formatIsoDateOnly } from '../domain/enrollment-identity';
import type {
  CreateEnrollmentRecordInput,
  EnrollmentRepository,
  IdCardEnrollmentData,
  ListEnrollmentsQuery,
  PaginatedEnrollments,
} from '../application/enrollment.repository';

type EnrollmentRow = {
  id: string;
  enrollmentId: string;
  idempotencyId: string;
  capturedAt: Date | null;
  status: Enrollment['status'];
  category: string;
  enrolledByUserId: string;
  wardId: string;
  healthFacilityId: string;
  passportObjectKey: string;
  idDocumentObjectKey: string;
  title: Enrollment['title'];
  gender: Enrollment['gender'];
  firstName: string;
  lastName: string;
  middleName: string | null;
  dateOfBirth: Date;
  phone: string;
  email: string | null;
  nin: string | null;
  maritalStatus: Enrollment['maritalStatus'];
  bloodGroup: Enrollment['bloodGroup'];
  genotype: Enrollment['genotype'];
  idType: Enrollment['idType'];
  nextOfKinFullName: string;
  emergencyPhone: string;
  nextOfKinRelationship: Enrollment['nextOfKinRelationship'];
  stateOfResidence: string;
  lgaOfResidence: string;
  residentialAddress: string;
  printedAt: Date | null;
  printCount: number;
  createdAt: Date;
  updatedAt: Date;
  ward: { id: string; name: string; lga: string };
  healthFacility: {
    id: string;
    name: string;
    ward: { id: string; name: string; lga: string };
  };
  enrolledBy: { id: string; name: string };
};

@Injectable()
export class PrismaEnrollmentRepository implements EnrollmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  private include = {
    ward: { select: { id: true, name: true, lga: true } },
    healthFacility: {
      select: {
        id: true,
        name: true,
        ward: { select: { id: true, name: true, lga: true } },
      },
    },
    enrolledBy: { select: { id: true, name: true } },
  } as const;

  private map(row: EnrollmentRow): Enrollment {
    return {
      id: row.id,
      enrollmentId: row.enrollmentId,
      idempotencyId: row.idempotencyId,
      capturedAt: row.capturedAt,
      status: row.status,
      category: row.category,
      enrolledByUserId: row.enrolledByUserId,
      wardId: row.wardId,
      healthFacilityId: row.healthFacilityId,
      passportObjectKey: row.passportObjectKey,
      idDocumentObjectKey: row.idDocumentObjectKey,
      title: row.title,
      gender: row.gender,
      firstName: row.firstName,
      lastName: row.lastName,
      middleName: row.middleName,
      dateOfBirth: formatIsoDateOnly(row.dateOfBirth),
      phone: row.phone,
      email: row.email,
      nin: row.nin,
      maritalStatus: row.maritalStatus,
      bloodGroup: row.bloodGroup,
      genotype: row.genotype,
      idType: row.idType,
      nextOfKinFullName: row.nextOfKinFullName,
      emergencyPhone: row.emergencyPhone,
      nextOfKinRelationship: row.nextOfKinRelationship,
      stateOfResidence: row.stateOfResidence,
      lgaOfResidence: row.lgaOfResidence,
      residentialAddress: row.residentialAddress,
      ward: row.ward,
      healthFacility: row.healthFacility,
      enrolledBy: row.enrolledBy,
      printedAt: row.printedAt,
      printCount: row.printCount,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private mapListItem(row: EnrollmentRow): EnrollmentListItem {
    return {
      id: row.id,
      enrollmentId: row.enrollmentId,
      beneficiaryName: enrollmentBeneficiaryName(row),
      category: row.category,
      status: row.status,
      healthFacility: row.healthFacility,
      createdAt: row.createdAt,
      hasPrinted: row.printedAt != null || row.printCount > 0,
      printCount: row.printCount,
      printedAt: row.printedAt,
    };
  }

  async allocateEnrollmentId(year: number): Promise<string> {
    const counter = await this.prisma.enrollmentYearCounter.upsert({
      where: { year },
      create: { year, lastValue: 1 },
      update: { lastValue: { increment: 1 } },
    });
    return formatEnrollmentId(year, counter.lastValue);
  }

  async create(input: CreateEnrollmentRecordInput): Promise<Enrollment> {
    const row = await this.prisma.enrollment.create({
      data: input,
      include: this.include,
    });
    return this.map(row);
  }

  async findById(id: string): Promise<Enrollment | null> {
    const row = await this.prisma.enrollment.findUnique({
      where: { id },
      include: this.include,
    });
    return row ? this.map(row) : null;
  }

  async findByIdempotencyId(
    idempotencyId: string,
  ): Promise<Enrollment | null> {
    const row = await this.prisma.enrollment.findUnique({
      where: { idempotencyId },
      include: this.include,
    });
    return row ? this.map(row) : null;
  }

  async findByIdentityKey(input: {
    firstNameNormalized: string;
    lastNameNormalized: string;
    dateOfBirth: Date;
  }): Promise<Enrollment | null> {
    const row = await this.prisma.enrollment.findUnique({
      where: {
        firstNameNormalized_lastNameNormalized_dateOfBirth: {
          firstNameNormalized: input.firstNameNormalized,
          lastNameNormalized: input.lastNameNormalized,
          dateOfBirth: input.dateOfBirth,
        },
      },
      include: this.include,
    });
    return row ? this.map(row) : null;
  }

  async findManyByIds(ids: string[]): Promise<IdCardEnrollmentData[]> {
    if (ids.length === 0) {
      return [];
    }

    const rows = await this.prisma.enrollment.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        enrollmentId: true,
        firstName: true,
        lastName: true,
        middleName: true,
        emergencyPhone: true,
        bloodGroup: true,
        passportObjectKey: true,
        healthFacility: { select: { name: true } },
      },
    });

    const byId = new Map(rows.map((row) => [row.id, row]));
    return ids.flatMap((id) => {
      const row = byId.get(id);
      if (!row) {
        return [];
      }
      return [
        {
          id: row.id,
          enrollmentId: row.enrollmentId,
          firstName: row.firstName,
          lastName: row.lastName,
          middleName: row.middleName,
          emergencyPhone: row.emergencyPhone,
          bloodGroup: row.bloodGroup,
          passportObjectKey: row.passportObjectKey,
          facilityName: row.healthFacility.name,
        },
      ];
    });
  }

  async markPrinted(ids: string[], printedAt: Date): Promise<void> {
    if (ids.length === 0) {
      return;
    }
    await this.prisma.enrollment.updateMany({
      where: { id: { in: ids } },
      data: {
        printedAt,
        printCount: { increment: 1 },
      },
    });
  }

  async list(query: ListEnrollmentsQuery): Promise<PaginatedEnrollments> {
    const limit = toQueryInt(query.limit, 50, { min: 1, max: 100 });

    const createdAtFilter =
      query.createdFrom || query.createdTo
        ? {
            createdAt: {
              ...(query.createdFrom ? { gte: query.createdFrom } : {}),
              ...(query.createdTo ? { lte: query.createdTo } : {}),
            },
          }
        : {};

    const printedFilter =
      query.printedStatus === 'printed'
        ? { OR: [{ printedAt: { not: null } }, { printCount: { gt: 0 } }] }
        : query.printedStatus === 'not_printed'
          ? { printedAt: null, printCount: 0 }
          : {};

    const where = {
      ...(query.cursor ? { id: { gt: query.cursor } } : {}),
      ...(query.wardId ? { wardId: query.wardId } : {}),
      ...(query.wardIds ? { wardId: { in: query.wardIds } } : {}),
      ...(query.enrolledByUserId
        ? { enrolledByUserId: query.enrolledByUserId }
        : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.lga
        ? { ward: { lga: { equals: query.lga, mode: 'insensitive' as const } } }
        : {}),
      ...(query.enrollmentId
        ? {
            enrollmentId: {
              contains: query.enrollmentId,
              mode: 'insensitive' as const,
            },
          }
        : {}),
      ...(query.beneficiaryName
        ? {
            OR: [
              {
                firstName: {
                  contains: query.beneficiaryName,
                  mode: 'insensitive' as const,
                },
              },
              {
                lastName: {
                  contains: query.beneficiaryName,
                  mode: 'insensitive' as const,
                },
              },
              {
                middleName: {
                  contains: query.beneficiaryName,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
      ...createdAtFilter,
      ...printedFilter,
      ...(query.search
        ? {
            AND: [
              {
                OR: [
                  {
                    enrollmentId: {
                      contains: query.search,
                      mode: 'insensitive' as const,
                    },
                  },
                  {
                    firstName: {
                      contains: query.search,
                      mode: 'insensitive' as const,
                    },
                  },
                  {
                    lastName: {
                      contains: query.search,
                      mode: 'insensitive' as const,
                    },
                  },
                  {
                    phone: {
                      contains: query.search,
                      mode: 'insensitive' as const,
                    },
                  },
                  {
                    nin: {
                      contains: query.search,
                      mode: 'insensitive' as const,
                    },
                  },
                  {
                    category: {
                      contains: query.search,
                      mode: 'insensitive' as const,
                    },
                  },
                ],
              },
            ],
          }
        : {}),
    };

    const rows = await this.prisma.enrollment.findMany({
      where,
      take: limit + 1,
      orderBy: { id: 'asc' },
      include: this.include,
    });

    return buildCursorPage(
      rows.map((row) => this.mapListItem(row)),
      limit,
    );
  }
}
