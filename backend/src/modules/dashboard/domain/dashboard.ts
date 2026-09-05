import type {
  DashboardPeriod,
  DashboardTrendGranularity,
} from './dashboard-period';

export const DASHBOARD_KNOWN_CATEGORIES = [
  'IDPs',
  'Elderly 65+',
  'Indigents / Very Poor / Others',
] as const;

export type DashboardKnownCategory =
  (typeof DASHBOARD_KNOWN_CATEGORIES)[number];

export const DASHBOARD_OTHER_CATEGORY = 'Other';

export function bucketEnrollmentCategory(category: string): string {
  if (
    (DASHBOARD_KNOWN_CATEGORIES as readonly string[]).includes(category)
  ) {
    return category;
  }
  return DASHBOARD_OTHER_CATEGORY;
}

/** Always return the three known categories; append Other only when it has count. */
export function normalizeCategoryBreakdown(
  rows: Array<{ category: string; count: number }>,
): Array<{ category: string; count: number }> {
  const totals = new Map<string, number>();
  for (const known of DASHBOARD_KNOWN_CATEGORIES) {
    totals.set(known, 0);
  }
  let other = 0;

  for (const row of rows) {
    const bucket = bucketEnrollmentCategory(row.category);
    if (bucket === DASHBOARD_OTHER_CATEGORY) {
      other += row.count;
    } else {
      totals.set(bucket, (totals.get(bucket) ?? 0) + row.count);
    }
  }

  const result: Array<{ category: string; count: number }> =
    DASHBOARD_KNOWN_CATEGORIES.map((category) => ({
      category,
      count: totals.get(category) ?? 0,
    }));

  if (other > 0) {
    result.push({ category: DASHBOARD_OTHER_CATEGORY, count: other });
  }

  return result;
}

export type KpiPercentChange = {
  value: number;
  changePercent: number;
};

export type KpiAbsoluteChange = {
  value: number;
  changeAbsolute: number;
};

export type DashboardTrendPoint = {
  key: string;
  label: string;
  count: number;
};

export type DashboardActivityItem = {
  id: string;
  category: string;
  action: string;
  summary: string;
  ward: { id: string; name: string };
  actor: { id: string; name: string } | null;
  occurredAt: Date;
};

export type DashboardStatusSlice = {
  count: number;
  percent: number;
};

export type DashboardOverview = {
  filters: {
    lga: string | null;
    wardId: string | null;
    period: DashboardPeriod;
    trend: DashboardTrendGranularity;
    periodStart: Date;
    periodEnd: Date;
  };
  kpis: {
    totalEnrollments: KpiPercentChange;
    activeBeneficiaries: KpiPercentChange;
    inactiveBeneficiaries: KpiPercentChange;
    newEnrollments: KpiPercentChange;
    totalFacilities: KpiAbsoluteChange;
    fieldWorkers: KpiAbsoluteChange;
  };
  enrollmentTrend: {
    total: number;
    average: number;
    granularity: DashboardTrendGranularity;
    points: DashboardTrendPoint[];
  };
  recentActivity: DashboardActivityItem[];
  enrollmentByCategory: Array<{ category: string; count: number }>;
  enrollmentByStatus: {
    active: DashboardStatusSlice;
    inactive: DashboardStatusSlice;
  };
  enrollmentByWard: Array<{ wardId: string; name: string; count: number }>;
  enrollmentByLga: Array<{ lga: string; count: number }>;
  facilityOverview: {
    totalFacilities: number;
    activeFacilities: number;
    totalBeneficiaries: number;
    items: Array<{
      id: string;
      name: string;
      lga: string;
      ward: { id: string; name: string };
      beneficiaries: number;
    }>;
  };
  fieldWorkerPerformance: {
    totalFieldWorkers: number;
    activeFieldWorkers: number;
    totalEnrolled: number;
    averagePerWorker: number;
    items: Array<{
      id: string;
      name: string;
      enrolled: number;
      lastActivityAt: Date | null;
      status: 'active' | 'inactive';
    }>;
  };
  recentEnrollments: Array<{
    id: string;
    enrollmentId: string;
    beneficiaryName: string;
    category: string;
    status: string;
    lga: string;
    ward: { id: string; name: string };
    facility: { id: string; name: string };
    createdAt: Date;
  }>;
};

export type DashboardQuery = {
  lga?: string;
  wardId?: string;
  period: DashboardPeriod;
  trend: DashboardTrendGranularity;
};
