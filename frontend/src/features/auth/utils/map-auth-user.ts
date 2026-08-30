import type { AdminUser, AuthUserApi } from '../types/auth.types'

export function mapAdminUser(user: AuthUserApi): AdminUser {
  if (user.role !== 'admin') {
    throw new Error('This account does not have access to the admin dashboard.')
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    phone: user.phone,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    assignedWards: user.assignedWards.map((ward) => ({
      id: ward.id,
      name: ward.name,
      lga: ward.lga,
    })),
  }
}
