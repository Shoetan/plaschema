import { assertUserRoleConstraints, toPublicUser, type User } from './user';

describe('identity domain user', () => {
  const baseUser: User = {
    id: '01900000-0000-7000-8000-000000000001',
    name: 'Worker',
    email: 'worker@cbhi.local',
    passwordHash: 'hash',
    role: 'field_worker',
    status: 'active',
    phone: '+2348012345678',
    lastSyncedAt: null,
    assignedWards: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('strips passwordHash from public user', () => {
    const publicUser = toPublicUser(baseUser);
    expect(publicUser).not.toHaveProperty('passwordHash');
    expect(publicUser.email).toBe(baseUser.email);
  });

  it('requires phone for field workers', () => {
    expect(() =>
      assertUserRoleConstraints({
        role: 'field_worker',
        phone: null,
      }),
    ).toThrow('PHONE_REQUIRED_FOR_FIELD_WORKER');
  });

  it('allows admin without phone', () => {
    expect(() =>
      assertUserRoleConstraints({
        role: 'admin',
        phone: null,
      }),
    ).not.toThrow();
  });
});
