export interface Ward {
  id: string
  name: string
  state: string
  lga: string
  status: string
  beneficiaries: number
  fieldWorkers: number
  newEnrollments: number
  lastActivity: string
}

export interface FieldWorker {
  id: string
  name: string
  phone: string
  email: string
  community: string
  communityId: string
  enrolled: number
  lastEnrollment: string
  lastSync: string
  status: string
}

export interface Facility {
  id: string
  code: string
  name: string
  type: string
  level: string
  ownership: string
  state: string
  lga: string
  ward: string
  community: string
  address: string
  contactPerson: string
  phone: string
  email: string
  status: string
  beneficiaries: number
  onboardingDate: string
}
