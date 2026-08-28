import { Navigate, createBrowserRouter } from 'react-router-dom'

import { AppLayout } from '@/components/app-layout'
import { ProtectedLayout } from '@/components/protected-layout'
import { BeneficiaryDetailPage } from '@/routes/beneficiary-detail'
import { BeneficiariesPage } from '@/routes/beneficiaries'
import { EnrollPage } from '@/routes/enroll'
import { HomePage } from '@/routes/home'
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
        { path: '/enroll', element: <EnrollPage /> },
        { path: '/beneficiaries', element: <BeneficiariesPage /> },
        { path: '/beneficiaries/:beneficiaryId', element: <BeneficiaryDetailPage /> },
        { path: '/sync', element: <SyncPage /> },
        { path: '/profile', element: <ProfilePage /> },
      ],
    }],
  },
  { path: '*', element: <Navigate replace to="/" /> },
])
