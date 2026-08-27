export type UserRole = 'admin' | 'field_worker';
export type UserStatus = 'active' | 'inactive';

export type UserWard = {
  id: string;
  name: string;
  lga: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  phone: string | null;
  assignedWards: UserWard[];
  createdAt: Date;
  updatedAt: Date;
};

export type PublicUser = Omit<User, 'passwordHash'>;

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

export function assertUserRoleConstraints(input: {
  role: UserRole;
  phone?: string | null;
  assignedWardIds?: string[];
}): void {
  if (input.role === 'field_worker') {
    if (!input.phone || input.phone.trim().length === 0) {
      throw new Error('PHONE_REQUIRED_FOR_FIELD_WORKER');
    }
  }
}
