import { create } from 'zustand'

import {
  beneficiaries as initialBeneficiaries,
  capitationRecords as initialCapitationRecords,
  communities as initialCommunities,
  facilities as initialFacilities,
  fieldWorkers as initialFieldWorkers,
} from '@/mocks/admin-data'
import type {
  Beneficiary,
  CapitationRecord,
  Facility,
  FieldWorker,
  Ward,
} from '@/types/admin.types'

export type { Beneficiary } from '@/types/admin.types'

interface AdminDataState {
  communities: Ward[]
  fieldWorkers: FieldWorker[]
  beneficiaries: Beneficiary[]
  facilities: Facility[]
  capitationRecords: CapitationRecord[]
  addWard: (ward: Ward) => void
  addFieldWorker: (fieldWorker: FieldWorker) => void
  addFacility: (facility: Facility) => void
  markBeneficiariesPrinted: (ids: string[]) => void
  setBeneficiaryStatus: (id: string, status: string) => void
}

export const useAdminDataStore = create<AdminDataState>((set) => ({
  communities: initialCommunities,
  fieldWorkers: initialFieldWorkers,
  beneficiaries: initialBeneficiaries,
  facilities: initialFacilities,
  capitationRecords: initialCapitationRecords,
  addWard: (ward) =>
    set((state) => ({ communities: [...state.communities, ward] })),
  addFieldWorker: (fieldWorker) =>
    set((state) => ({ fieldWorkers: [...state.fieldWorkers, fieldWorker] })),
  addFacility: (facility) =>
    set((state) => ({ facilities: [...state.facilities, facility] })),
  markBeneficiariesPrinted: (ids) =>
    set((state) => ({
      beneficiaries: state.beneficiaries.map((beneficiary) =>
        ids.includes(beneficiary.id)
          ? { ...beneficiary, hasPrinted: true }
          : beneficiary,
      ),
    })),
  setBeneficiaryStatus: (id, status) =>
    set((state) => ({
      beneficiaries: state.beneficiaries.map((beneficiary) =>
        beneficiary.id === id ? { ...beneficiary, status } : beneficiary,
      ),
    })),
}))
