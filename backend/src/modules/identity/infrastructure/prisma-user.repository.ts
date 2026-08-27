import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/persistence/prisma.service';
import type { PublicUser, User } from '../domain/user';
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
    const where = {
      ...(query.role ? { role: query.role } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const skip = (query.page - 1) * query.pageSize;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
        include: this.include,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: rows.map((row) => toPublicUser(this.map(row))),
      total,
      page: query.page,
      pageSize: query.pageSize,
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
