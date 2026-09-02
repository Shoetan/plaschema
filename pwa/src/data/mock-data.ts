import type { Beneficiary } from '@/types'

export const wards = ['Tudun Wada', 'Angwan Rogo', 'Gangare', 'Jenta Adamu']

export const facilitiesByWard: Record<string, string[]> = {
  'Tudun Wada': ['Tudun Wada PHC', 'Jos University Teaching Hospital'],
  'Angwan Rogo': ['Angwan Rogo Health Centre'],
  Gangare: ['Gangare Clinic'],
  'Jenta Adamu': ['Jenta Adamu PHC'],
}

export const initialBeneficiaries: Beneficiary[] = [
  {
    id: 'mock-1', beneficiaryCode: 'BEN-2026-00001', capturedAt: '2026-08-28T08:42:00.000Z',
    passportName: 'musa-passport.jpg', idDocumentName: 'musa-id.jpg', title: 'Mr',
    firstName: 'Musa', middleName: '', lastName: 'Ibrahim', gender: 'Male',
    dateOfBirth: '1990-05-04', maritalStatus: 'Married', phone: '+234 801 234 5678',
    email: 'musa@example.com', stateOfResidence: 'Plateau', lgaOfResidence: 'Jos North',
    residentialAddress: '12 Yakubu Gowon Way, Jos', ward: 'Tudun Wada',
    healthFacility: 'Tudun Wada PHC', idType: 'National ID', nextOfKinFullName: 'Aisha Ibrahim',
    emergencyPhone: '+234 809 876 5432', nextOfKinRelationship: 'Spouse', syncStatus: 'Synced',
  },
  {
    id: 'mock-2', beneficiaryCode: 'BEN-2026-00002', capturedAt: '2026-08-28T07:18:00.000Z',
    passportName: 'halima-passport.jpg', idDocumentName: 'halima-id.pdf', title: 'Mrs',
    firstName: 'Halima', middleName: 'Sadiya', lastName: 'Usman', gender: 'Female',
    dateOfBirth: '1988-11-20', maritalStatus: 'Married', phone: '+234 802 222 1122',
    email: '', stateOfResidence: 'Plateau', lgaOfResidence: 'Jos North',
    residentialAddress: '4 Bauchi Road, Jos', ward: 'Angwan Rogo',
    healthFacility: 'Angwan Rogo Health Centre', idType: "Voter's Card", nextOfKinFullName: 'Usman Bala',
    emergencyPhone: '+234 805 444 5566', nextOfKinRelationship: 'Spouse', syncStatus: 'Pending',
  },
  {
    id: 'mock-3', beneficiaryCode: 'BEN-2026-00003', capturedAt: '2026-08-27T15:05:00.000Z',
    passportName: 'yakubu-passport.jpg', idDocumentName: 'yakubu-id.jpg', title: 'Mr',
    firstName: 'Yakubu', middleName: '', lastName: 'Garba', gender: 'Male',
    dateOfBirth: '1979-02-10', maritalStatus: 'Single', phone: '+234 806 111 3344',
    email: '', stateOfResidence: 'Plateau', lgaOfResidence: 'Jos North',
    residentialAddress: '20 Rukuba Road, Jos', ward: 'Gangare', healthFacility: 'Gangare Clinic',
    idType: 'NIN', nextOfKinFullName: 'Bala Garba', emergencyPhone: '+234 807 100 2000',
    nextOfKinRelationship: 'Sibling', syncStatus: 'Failed', syncError: 'Mock network timeout',
  },
]
