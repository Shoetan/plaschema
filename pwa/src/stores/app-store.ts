import { create } from 'zustand'

import { initialBeneficiaries, mockUser } from '@/data/mock-data'
import type { Beneficiary, EnrollmentDraft, MockUser, SyncStatus } from '@/types'

interface AppState {
  user: MockUser | null
  beneficiaries: Beneficiary[]
  lastSyncAt: string | null
  signIn: (email: string) => void
  signOut: () => void
  addEnrollment: (draft: EnrollmentDraft) => Beneficiary
  setSyncStatus: (id: string, status: SyncStatus, message?: string) => void
  syncAll: () => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  beneficiaries: initialBeneficiaries,
  lastSyncAt: '2026-08-28T09:42:00.000Z',
  signIn: (email) => set({ user: { ...mockUser, email } }),
  signOut: () => set({ user: null }),
  addEnrollment: (draft) => {
    const beneficiary: Beneficiary = {
      ...draft,
      beneficiaryCode: `LOCAL-${String(get().beneficiaries.length + 1).padStart(4, '0')}`,
    }
    set((state) => ({ beneficiaries: [beneficiary, ...state.beneficiaries] }))
    return beneficiary
  },
  setSyncStatus: (id, status, message) => set((state) => ({
    beneficiaries: state.beneficiaries.map((record) =>
      record.id === id ? { ...record, syncStatus: status, syncError: message } : record,
    ),
  })),
  syncAll: async () => {
    const ids = get().beneficiaries.filter((record) => record.syncStatus !== 'Synced').map((record) => record.id)
    for (const id of ids) {
      get().setSyncStatus(id, 'Syncing')
      await new Promise((resolve) => window.setTimeout(resolve, 450))
      get().setSyncStatus(id, 'Synced')
    }
    set({ lastSyncAt: new Date().toISOString() })
  },
}))
