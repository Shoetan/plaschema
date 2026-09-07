import type {
  DashboardCategoryCount,
  DashboardStatusBreakdown,
  DashboardTrendPoint,
} from '../types'

export interface TrendDatum {
  key: string
  label: string
  count: number
}

export interface EnrollmentBarItem {
  id: string
  label: string
  count: number
}

export interface StatusDatum {
  name: string
  count: number
  percent: number
}

function safeCount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0
}

function safePercent(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

export function toTrendSeries(points: DashboardTrendPoint[]): TrendDatum[] {
  return points.map((point) => ({ key: point.key, label: point.label, count: safeCount(point.count) }))
}

export function toCategorySeries(items: DashboardCategoryCount[]): EnrollmentBarItem[] {
  return items.map((item) => ({ id: item.category, label: item.category, count: safeCount(item.count) }))
}

export function toWardSeries(items: Array<{ wardId: string; name: string; count: number }>): EnrollmentBarItem[] {
  return items.map((item) => ({ id: item.wardId, label: item.name, count: safeCount(item.count) }))
}

export function toLgaSeries(items: Array<{ lga: string; count: number }>): EnrollmentBarItem[] {
  return items.map((item) => ({ id: item.lga, label: item.lga, count: safeCount(item.count) }))
}

export function toStatusSeries(breakdown: DashboardStatusBreakdown): StatusDatum[] {
  return [
    { name: 'Active', count: safeCount(breakdown.active.count), percent: safePercent(breakdown.active.percent) },
    { name: 'Inactive', count: safeCount(breakdown.inactive.count), percent: safePercent(breakdown.inactive.percent) },
  ]
}
