import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AdminUser {
  email: string
  name: string
  role: string
}

interface AuthState {
  user: AdminUser | null
  login: (email: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (email) =>
        set({ user: { email, name: 'Admin User', role: 'Program Manager' } }),
      logout: () => set({ user: null }),
    }),
    { name: 'plaschema-admin-session' },
  ),
)
