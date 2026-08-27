import type { PublicUser, User, UserRole, UserStatus } from '../domain/user';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export type CreateUserInput = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  phone: string | null;
  assignedWardIds: string[];
};

export type UpdateUserInput = {
  name?: string;
  phone?: string | null;
  status?: UserStatus;
  passwordHash?: string;
  assignedWardIds?: string[];
};

export type ListUsersQuery = {
  page: number;
  pageSize: number;
  role?: UserRole;
  status?: UserStatus;
};

export type PaginatedUsers = {
  items: PublicUser[];
  total: number;
  page: number;
  pageSize: number;
};

export interface UserRepository {
  create(input: CreateUserInput): Promise<PublicUser>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  list(query: ListUsersQuery): Promise<PaginatedUsers>;
  update(id: string, input: UpdateUserInput): Promise<PublicUser>;
  wardIdsExist(wardIds: string[]): Promise<boolean>;
}
