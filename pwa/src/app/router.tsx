import { Navigate, createBrowserRouter } from 'react-router-dom'

import { AppLayout } from '@/components/app-layout'
import { ProtectedLayout } from '@/components/protected-layout'
import { BeneficiaryDetailPage } from '@/routes/beneficiary-detail'
import { BeneficiariesPage } from '@/routes/beneficiaries'
import { AddHouseholdMemberPage } from '@/routes/add-household-member'
import { EnrollHouseholdPage } from '@/routes/enroll-household'
import { HomePage } from '@/routes/home'
import { HouseholdsPage } from '@/routes/households'
import { LoginPage } from '@/routes/login'
import { ProfilePage } from '@/routes/profile'
import { SyncPage } from '@/routes/sync'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedLayout />,
    children: [{
      element: <AppLayout />,
      children: [
        { path: '/', element: <HomePage /> },
        { path: '/enroll-household', element: <EnrollHouseholdPage /> },
        { path: '/households', element: <HouseholdsPage /> },
        { path: '/households/:householdLocalId/add-member', element: <AddHouseholdMemberPage /> },
        { path: '/beneficiaries', element: <BeneficiariesPage /> },
        { path: '/beneficiaries/:beneficiaryId', element: <BeneficiaryDetailPage /> },
        { path: '/sync', element: <SyncPage /> },
        { path: '/profile', element: <ProfilePage /> },
      ],
    }],
  },
  { path: '*', element: <Navigate replace to="/" /> },
])
