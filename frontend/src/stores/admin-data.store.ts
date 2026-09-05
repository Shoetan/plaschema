import { create } from 'zustand'

import {
  communities as initialCommunities,
  facilities as initialFacilities,
  fieldWorkers as initialFieldWorkers,
} from '@/mocks/admin-data'
import type {
  Facility,
  FieldWorker,
  Ward,
} from '@/types/admin.types'

interface AdminDataState {
  communities: Ward[]
  fieldWorkers: FieldWorker[]
  facilities: Facility[]
  addWard: (ward: Ward) => void
  addFieldWorker: (fieldWorker: FieldWorker) => void
  addFacility: (facility: Facility) => void
}

export const useAdminDataStore = create<AdminDataState>((set) => ({
  communities: initialCommunities,
  fieldWorkers: initialFieldWorkers,
  facilities: initialFacilities,
  addWard: (ward) =>
    set((state) => ({ communities: [...state.communities, ward] })),
  addFieldWorker: (fieldWorker) =>
    set((state) => ({ fieldWorkers: [...state.fieldWorkers, fieldWorker] })),
  addFacility: (facility) =>
    set((state) => ({ facilities: [...state.facilities, facility] })),
}))
