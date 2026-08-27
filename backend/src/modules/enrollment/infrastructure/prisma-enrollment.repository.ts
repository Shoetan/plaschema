import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/persistence/prisma.service';
import type { Enrollment } from '../domain/enrollment';
import { formatIsoDateOnly } from '../domain/enrollment-identity';
import type {
  CreateEnrollmentRecordInput,
  EnrollmentRepository,
  ListEnrollmentsQuery,
  PaginatedEnrollments,
} from '../application/enrollment.repository';

type EnrollmentRow = {
  id: string;
  idempotencyId: string;
  capturedAt: Date | null;
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
  createdAt: Date;
  updatedAt: Date;
  ward: { id: string; name: string };
  healthFacility: { id: string; name: string };
  enrolledBy: { id: string; name: string };
};

@Injectable()
export class PrismaEnrollmentRepository implements EnrollmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  private include = {
    ward: { select: { id: true, name: true } },
    healthFacility: { select: { id: true, name: true } },
    enrolledBy: { select: { id: true, name: true } },
  } as const;

  private map(row: EnrollmentRow): Enrollment {
    return {
      id: row.id,
      idempotencyId: row.idempotencyId,
      capturedAt: row.capturedAt,
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
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
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

  async list(query: ListEnrollmentsQuery): Promise<PaginatedEnrollments> {
    const where = {
      ...(query.wardId ? { wardId: query.wardId } : {}),
      ...(query.wardIds ? { wardId: { in: query.wardIds } } : {}),
      ...(query.enrolledByUserId
        ? { enrolledByUserId: query.enrolledByUserId }
        : {}),
      ...(query.search
        ? {
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
            ],
          }
        : {}),
    };

    const skip = (query.page - 1) * query.pageSize;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.enrollment.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
        include: this.include,
      }),
      this.prisma.enrollment.count({ where }),
    ]);

    return {
      items: rows.map((row) => this.map(row)),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }
}
