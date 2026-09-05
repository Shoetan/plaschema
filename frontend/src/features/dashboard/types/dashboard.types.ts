export type DashboardPeriod = '7d' | '30d' | '3m' | '6m' | '1y'
export type DashboardTrendGranularity = 'daily' | 'weekly' | 'monthly'
export type DashboardEnrollmentStatus = 'pending' | 'active' | 'disabled' | 'deceased'
export type DashboardWorkerStatus = 'active' | 'inactive'
export type DashboardActivityCategory = 'enrollment' | 'ward' | 'user' | 'sync'
export type DashboardActivityAction = 'created' | 'updated' | 'status_changed' | 'printed' | 'assigned'

export interface DashboardParams {
  lga?: string
  wardId?: string
  period: DashboardPeriod
  trend: DashboardTrendGranularity
}

export interface DashboardIdName {
  id: string
  name: string
}

export interface DashboardPercentKpi {
  value: number
  changePercent: number
}

export interface DashboardAbsoluteKpi {
  value: number
  changeAbsolute: number
}

export interface DashboardTrendPoint {
  key: string
  label: string
  count: number
}

export interface DashboardActivityItem {
  id: string
  category: DashboardActivityCategory
  action: DashboardActivityAction
  summary: string
  ward: DashboardIdName
  actor: DashboardIdName | null
  occurredAt: string
}

export interface DashboardStatusSlice {
  count: number
  percent: number
}

export interface DashboardFacilityItem {
  id: string
  name: string
  lga: string
  ward: DashboardIdName
  beneficiaries: number
}

export interface DashboardFieldWorkerItem {
  id: string
  name: string
  enrolled: number
  lastActivityAt: string | null
  status: DashboardWorkerStatus
}

export interface DashboardRecentEnrollment {
  id: string
  enrollmentId: string
  beneficiaryName: string
  category: string
  status: DashboardEnrollmentStatus
  lga: string
  ward: DashboardIdName
  facility: DashboardIdName
  createdAt: string
}

export interface DashboardOverview {
  filters: {
    lga: string | null
    wardId: string | null
    period: DashboardPeriod
    trend: DashboardTrendGranularity
    periodStart: string
    periodEnd: string
  }
  kpis: {
    totalEnrollments: DashboardPercentKpi
    activeBeneficiaries: DashboardPercentKpi
    inactiveBeneficiaries: DashboardPercentKpi
    newEnrollments: DashboardPercentKpi
    totalFacilities: DashboardAbsoluteKpi
    fieldWorkers: DashboardAbsoluteKpi
  }
  enrollmentTrend: {
    total: number
    average: number
    granularity: DashboardTrendGranularity
    points: DashboardTrendPoint[]
  }
  recentActivity: DashboardActivityItem[]
  enrollmentByCategory: Array<{ category: string; count: number }>
  enrollmentByStatus: {
    active: DashboardStatusSlice
    inactive: DashboardStatusSlice
  }
  enrollmentByWard: Array<{ wardId: string; name: string; count: number }>
  enrollmentByLga: Array<{ lga: string; count: number }>
  facilityOverview: {
    totalFacilities: number
    activeFacilities: number
    totalBeneficiaries: number
    items: DashboardFacilityItem[]
  }
  fieldWorkerPerformance: {
    totalFieldWorkers: number
    activeFieldWorkers: number
    totalEnrolled: number
    averagePerWorker: number
    items: DashboardFieldWorkerItem[]
  }
  recentEnrollments: DashboardRecentEnrollment[]
}
