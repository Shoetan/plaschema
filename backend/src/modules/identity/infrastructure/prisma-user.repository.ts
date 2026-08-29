import { Injectable } from '@nestjs/common';
import { buildCursorPage } from '../../../platform/http/cursor-pagination';
import { toQueryInt } from '../../../platform/http/query-transforms';
import { PrismaService } from '../../../platform/persistence/prisma.service';
import type {
  FieldWorkerListItem,
  PublicUser,
  User,
} from '../domain/user';
import { toPublicUser } from '../domain/user';
import type {
  CreateUserInput,
  ListUsersQuery,
  PaginatedUsers,
  UpdateUserInput,
  UserRepository,
} from '../application/user.repository';

type UserWithWards = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'field_worker';
  status: 'active' | 'inactive';
  phone: string | null;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  assignedWards: Array<{
    ward: { id: string; name: string; lga: string };
  }>;
};

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  private map(user: UserWithWards): User {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
      status: user.status,
      phone: user.phone,
      lastSyncedAt: user.lastSyncedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      assignedWards: user.assignedWards.map((assignment) => assignment.ward),
    };
  }

  private include = {
    assignedWards: {
      include: {
        ward: {
          select: { id: true, name: true, lga: true },
        },
      },
    },
  } as const;

  async create(input: CreateUserInput): Promise<PublicUser> {
    const user = await this.prisma.user.create({
      data: {
        id: input.id,
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
        role: input.role,
        status: input.status,
        phone: input.phone,
        assignedWards: {
          create: input.assignedWardIds.map((wardId) => ({ wardId })),
        },
      },
      include: this.include,
    });

    return toPublicUser(this.map(user));
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: this.include,
    });
    return user ? this.map(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: this.include,
    });
    return user ? this.map(user) : null;
  }

  async list(query: ListUsersQuery): Promise<PaginatedUsers> {
    const limit = toQueryInt(query.limit, 50, { min: 1, max: 100 });
    const where = {
      ...(query.cursor ? { id: { gt: query.cursor } } : {}),
      ...(query.role ? { role: query.role } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              {
                name: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                email: {
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
            ],
          }
        : {}),
    };

    const rows = await this.prisma.user.findMany({
      where,
      take: limit + 1,
      orderBy: { id: 'asc' },
      include: this.include,
    });

    if (query.role === 'field_worker') {
      return this.mapFieldWorkerPage(rows, limit);
    }

    return buildCursorPage(
      rows.map((row) => toPublicUser(this.map(row))),
      limit,
    );
  }

  private async mapFieldWorkerPage(
    rows: UserWithWards[],
    limit: number,
  ): Promise<PaginatedUsers> {
    const pageRows = rows.length > limit ? rows.slice(0, limit) : rows;
    const userIds = pageRows.map((row) => row.id);

    const enrollmentStats =
      userIds.length === 0
        ? []
        : await this.prisma.enrollment.groupBy({
            by: ['enrolledByUserId'],
            where: { enrolledByUserId: { in: userIds } },
            _count: { _all: true },
            _max: { createdAt: true },
          });

    const statsByUser = new Map(
      enrollmentStats.map((stat) => [
        stat.enrolledByUserId,
        {
          beneficiariesEnrolled: stat._count._all,
          lastEnrollmentAt: stat._max.createdAt,
        },
      ]),
    );

    const items: FieldWorkerListItem[] = pageRows.map((row) => {
      const mapped = this.map(row);
      const stats = statsByUser.get(row.id);
      return {
        id: mapped.id,
        name: mapped.name,
        phone: mapped.phone,
        email: mapped.email,
        wards: mapped.assignedWards,
        beneficiariesEnrolled: stats?.beneficiariesEnrolled ?? 0,
        lastEnrollmentAt: stats?.lastEnrollmentAt ?? null,
        lastSyncedAt: mapped.lastSyncedAt,
        status: mapped.status,
      };
    });

    const hasMore = rows.length > limit;
    const last = items[items.length - 1];

    return {
      items,
      nextCursor: hasMore && last ? last.id : null,
      hasMore,
      limit,
    };
  }

  async update(id: string, input: UpdateUserInput): Promise<PublicUser> {
    const user = await this.prisma.$transaction(async (tx) => {
      if (input.assignedWardIds !== undefined) {
        await tx.userWardAssignment.deleteMany({ where: { userId: id } });
        if (input.assignedWardIds.length > 0) {
          await tx.userWardAssignment.createMany({
            data: input.assignedWardIds.map((wardId) => ({
              userId: id,
              wardId,
            })),
          });
        }
      }

      return tx.user.update({
        where: { id },
        data: {
          name: input.name,
          phone: input.phone,
          status: input.status,
          passwordHash: input.passwordHash,
          lastSyncedAt: input.lastSyncedAt,
        },
        include: this.include,
      });
    });

    return toPublicUser(this.map(user));
  }

  async wardIdsExist(wardIds: string[]): Promise<boolean> {
    if (wardIds.length === 0) {
      return true;
    }
    const unique = [...new Set(wardIds)];
    const count = await this.prisma.ward.count({
      where: { id: { in: unique } },
    });
    return count === unique.length;
  }
}
