export type UserRole = 'admin' | 'field_worker';
export type UserStatus = 'active' | 'inactive';

export type UserWard = {
  id: string;
  name: string;
  lga: string;
};

/** Re-exported for field worker detail ward rows. */
export type FieldWorkerDetailWard = UserWard & { state: 'Plateau' };

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  phone: string | null;
  lastSyncedAt: Date | null;
  assignedWards: UserWard[];
  createdAt: Date;
  updatedAt: Date;
};

export type PublicUser = Omit<User, 'passwordHash'>;

/** Slim row for the Field Workers admin table (GET /users?role=field_worker). */
export type FieldWorkerListItem = {
  id: string;
  name: string;
  phone: string | null;
  email: string;
  /** Assigned wards (replaces legacy "community" column). Empty = all wards. */
  wards: UserWard[];
  beneficiariesEnrolled: number;
  lastEnrollmentAt: Date | null;
  lastSyncedAt: Date | null;
  status: UserStatus;
};

export type FieldWorkerDetailStats = {
  totalEnrolled: number;
  enrollmentsThisMonth: number;
  lastEnrollmentAt: Date | null;
  lastSyncedAt: Date | null;
};

export type FieldWorkerDetailOverview = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type FieldWorkerDetailAggregates = {
  stats: FieldWorkerDetailStats;
  wards: FieldWorkerDetailWard[];
};

export type UserListItem = PublicUser | FieldWorkerListItem;

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
