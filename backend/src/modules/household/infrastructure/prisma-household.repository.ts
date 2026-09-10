import { Injectable } from '@nestjs/common';
import { buildCursorPage } from '../../../platform/http/cursor-pagination';
import { toQueryInt } from '../../../platform/http/query-transforms';
import { PrismaService } from '../../../platform/persistence/prisma.service';
import { formatIsoDateOnly } from '../../enrollment/domain/enrollment-identity';
import {
  enrollmentBeneficiaryName,
  formatHouseholdMemberEnrollmentId,
} from '../../enrollment/domain/enrollment-id';
import type { Enrollment } from '../../enrollment/domain/enrollment';
import type {
  CreateHouseholdHeadInput,
  CreateHouseholdMemberInput,
  HouseholdRepository,
  ListHouseholdsQuery,
  PaginatedHouseholds,
} from '../application/household.repository';
import type {
  Household,
  HouseholdDetail,
  HouseholdListItem,
} from '../domain/household';

const enrollmentInclude = {
  ward: { select: { id: true, name: true, lga: true } },
  healthFacility: {
    select: {
      id: true,
      name: true,
      ward: { select: { id: true, name: true, lga: true } },
    },
  },
  enrolledBy: { select: { id: true, name: true } },
  household: { select: { id: true, householdCode: true } },
} as const;

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
  passportPrintObjectKey: string | null;
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
  emergencyPhone: string | null;
  stateOfResidence: string;
  lgaOfResidence: string;
  residentialAddress: string;
  householdId: string | null;
  householdRole: Enrollment['householdRole'];
  memberSequence: number | null;
  printedAt: Date | null;
  printCount: number;
  createdAt: Date;
  updatedAt: Date;
  ward: Enrollment['ward'];
  healthFacility: Enrollment['healthFacility'];
  enrolledBy: Enrollment['enrolledBy'];
  household: { id: string; householdCode: string } | null;
};

@Injectable()
export class PrismaHouseholdRepository implements HouseholdRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapEnrollment(row: EnrollmentRow): Enrollment {
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
      passportPrintObjectKey: row.passportPrintObjectKey,
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
      emergencyPhone: row.emergencyPhone,
      stateOfResidence: row.stateOfResidence,
      lgaOfResidence: row.lgaOfResidence,
      residentialAddress: row.residentialAddress,
      householdId: row.householdId,
      householdRole: row.householdRole,
      memberSequence: row.memberSequence,
      household: row.household,
      ward: row.ward,
      healthFacility: row.healthFacility,
      enrolledBy: row.enrolledBy,
      printedAt: row.printedAt,
      printCount: row.printCount,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private mapHousehold(row: {
    id: string;
    householdLocalId: string;
    householdCode: string;
    wardId: string;
    headEnrollmentId: string | null;
    baseEnrollmentId: string | null;
    residentialAddress: string | null;
    memberCount: number;
    createdAt: Date;
    updatedAt: Date;
  }): Household {
    return row;
  }

  findById(id: string): Promise<Household | null> {
    return this.prisma.household.findUnique({ where: { id } });
  }

  findByLocalId(householdLocalId: string): Promise<Household | null> {
    return this.prisma.household.findUnique({ where: { householdLocalId } });
  }

  findByWardAndCode(
    wardId: string,
    householdCode: string,
  ): Promise<Household | null> {
    return this.prisma.household.findUnique({
      where: {
        wardId_householdCode: { wardId, householdCode },
      },
    });
  }

  async createHeadEnrollment(input: CreateHouseholdHeadInput): Promise<{
    household: Household;
    enrollment: Enrollment;
  }> {
    return this.prisma.$transaction(async (tx) => {
      const household = await tx.household.upsert({
        where: { householdLocalId: input.household.householdLocalId },
        create: {
          id: input.household.id,
          householdLocalId: input.household.householdLocalId,
          householdCode: input.household.householdCode,
          wardId: input.household.wardId,
          residentialAddress: input.household.residentialAddress,
        },
        update: {
          residentialAddress: input.household.residentialAddress,
        },
      });

      if (household.headEnrollmentId) {
        throw new Error('HOUSEHOLD_HEAD_EXISTS');
      }

      const enrollmentRow = await tx.enrollment.create({
        data: {
          ...input.enrollment,
          householdId: household.id,
          householdRole: 'head',
          memberSequence: null,
        },
        include: enrollmentInclude,
      });

      const updatedHousehold = await tx.household.update({
        where: { id: household.id },
        data: {
          headEnrollmentId: enrollmentRow.id,
          baseEnrollmentId: input.enrollment.enrollmentId,
        },
      });

      return {
        household: this.mapHousehold(updatedHousehold),
        enrollment: this.mapEnrollment(enrollmentRow),
      };
    });
  }

  async createMemberEnrollment(
    input: CreateHouseholdMemberInput,
  ): Promise<Enrollment> {
    return this.prisma.$transaction(async (tx) => {
      const household = await tx.household.findUnique({
        where: { id: input.householdId },
      });
      if (!household?.baseEnrollmentId) {
        throw new Error('HOUSEHOLD_HEAD_NOT_SYNCED');
      }

      const updatedHousehold = await tx.household.update({
        where: { id: input.householdId },
        data: { memberCount: { increment: 1 } },
      });
      const memberSequence = updatedHousehold.memberCount;
      const enrollmentId = formatHouseholdMemberEnrollmentId(
        household.baseEnrollmentId,
        memberSequence,
      );

      const enrollmentRow = await tx.enrollment.create({
        data: {
          ...input.enrollment,
          enrollmentId,
          householdId: input.householdId,
          householdRole: 'member',
          memberSequence,
        },
        include: enrollmentInclude,
      });

      return this.mapEnrollment(enrollmentRow);
    });
  }

  async findDetail(id: string): Promise<HouseholdDetail | null> {
    const row = await this.prisma.household.findUnique({
      where: { id },
      include: {
        ward: { select: { id: true, name: true, lga: true, code: true } },
        enrollments: {
          orderBy: [{ householdRole: 'asc' }, { memberSequence: 'asc' }],
          select: {
            id: true,
            enrollmentId: true,
            householdRole: true,
            memberSequence: true,
            firstName: true,
            lastName: true,
            status: true,
          },
        },
      },
    });

    if (!row) {
      return null;
    }

    const headRow = row.enrollments.find(
      (enrollment) => enrollment.householdRole === 'head',
    );
    const members = row.enrollments.filter(
      (enrollment) => enrollment.householdRole === 'member',
    );

    return {
      household: {
        ...this.mapHousehold(row),
        ward: row.ward,
      },
      head: headRow
        ? {
            id: headRow.id,
            enrollmentId: headRow.enrollmentId,
            householdRole: 'head',
            memberSequence: null,
            firstName: headRow.firstName,
            lastName: headRow.lastName,
            status: headRow.status,
          }
        : null,
      members: members.map((member) => ({
        id: member.id,
        enrollmentId: member.enrollmentId,
        householdRole: 'member',
        memberSequence: member.memberSequence,
        firstName: member.firstName,
        lastName: member.lastName,
        status: member.status,
      })),
    };
  }

  async list(query: ListHouseholdsQuery): Promise<PaginatedHouseholds> {
    const limit = toQueryInt(query.limit, 50, { min: 1, max: 100 });
    const filterWhere = {
      ...(query.wardId ? { wardId: query.wardId } : {}),
      ...(query.wardIds?.length ? { wardId: { in: query.wardIds } } : {}),
      ...(query.lga
        ? { ward: { lga: { equals: query.lga, mode: 'insensitive' as const } } }
        : {}),
      ...(query.householdCode
        ? {
            householdCode: {
              equals: query.householdCode,
              mode: 'insensitive' as const,
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              {
                householdCode: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                residentialAddress: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                headEnrollment: {
                  OR: [
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
                  ],
                },
              },
            ],
          }
        : {}),
    };
    const where = {
      ...filterWhere,
      ...(query.cursor ? { id: { gt: query.cursor } } : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.household.count({ where: filterWhere }),
      this.prisma.household.findMany({
        where,
        take: limit + 1,
        orderBy: { id: 'asc' },
        include: {
          ward: { select: { id: true, name: true, lga: true, code: true } },
          headEnrollment: {
            select: { firstName: true, lastName: true },
          },
        },
      }),
    ]);

    const items: HouseholdListItem[] = (
      rows.length > limit ? rows.slice(0, limit) : rows
    ).map((row) => ({
      id: row.id,
      householdLocalId: row.householdLocalId,
      householdCode: row.householdCode,
      wardId: row.wardId,
      ward: row.ward,
      headName: row.headEnrollment
        ? enrollmentBeneficiaryName(row.headEnrollment)
        : null,
      memberCount: row.memberCount,
      residentialAddress: row.residentialAddress,
      createdAt: row.createdAt,
    }));

    return buildCursorPage(items, limit, total);
  }
}
