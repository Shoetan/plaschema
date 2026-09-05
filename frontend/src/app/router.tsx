import { Navigate, createBrowserRouter } from 'react-router-dom'

import { ProtectedLayout } from '@/components/layout/protected-layout'
import { LoginPage } from '@/routes/login'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/admin',
    element: <ProtectedLayout />,
    children: [
      { index: true, handle: { title: 'Dashboard' }, lazy: async () => ({ Component: (await import('@/routes/dashboard')).DashboardPage }) },
      { path: 'wards', handle: { title: 'Wards' }, lazy: async () => ({ Component: (await import('@/routes/wards')).WardsPage }) },
      { path: 'wards/:wardId', lazy: async () => ({ Component: (await import('@/routes/ward-detail')).WardDetailPage }) },
      { path: 'field-workers', handle: { title: 'Field Workers' }, lazy: async () => ({ Component: (await import('@/routes/field-workers')).FieldWorkersPage }) },
      {
        path: 'field-workers/:fieldWorkerId',
        lazy: async () => ({ Component: (await import('@/routes/field-worker-detail')).FieldWorkerDetailPage }),
      },
      { path: 'beneficiaries', handle: { title: 'CBHI Enrolments' }, lazy: async () => ({ Component: (await import('@/routes/beneficiaries')).BeneficiariesPage }) },
      {
        path: 'beneficiaries/:beneficiaryId',
        lazy: async () => ({ Component: (await import('@/routes/beneficiary-detail')).BeneficiaryDetailPage }),
      },
      { path: 'facilities', handle: { title: 'Facilities' }, lazy: async () => ({ Component: (await import('@/routes/facilities')).FacilitiesPage }) },
      {
        path: 'facilities/:facilityId',
        lazy: async () => ({ Component: (await import('@/routes/facility-detail')).FacilityDetailPage }),
      },
      { path: 'capitation', handle: { title: 'Capitation' }, lazy: async () => ({ Component: (await import('@/routes/capitation')).CapitationPage }) },
      { path: 'id-cards', handle: { title: 'ID Cards' }, lazy: async () => ({ Component: (await import('@/routes/id-cards')).IdCardsPage }) },
      { path: 'reports', handle: { title: 'Reports' }, lazy: async () => ({ Component: (await import('@/routes/reports')).ReportsPage }) },
      { path: 'files', handle: { title: 'Files' }, lazy: async () => ({ Component: (await import('@/routes/files')).FilesPage }) },
      { path: 'settings', handle: { title: 'Settings' }, lazy: async () => ({ Component: (await import('@/routes/settings')).SettingsPage }) },
    ],
  },
  { path: '/', element: <Navigate replace to="/admin" /> },
  { path: '*', element: <Navigate replace to="/" /> },
])
