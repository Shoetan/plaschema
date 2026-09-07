import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { cardShadow } from '@/components/admin/styles'

import type { DashboardTrendGranularity, DashboardTrendPoint } from '../types'
import { toTrendSeries, type TrendDatum } from '../utils'

import { DashboardEmptyState } from './dashboard-empty-state'

const GRANULARITY_NOUN: Record<DashboardTrendGranularity, string> = {
  daily: 'day',
  weekly: 'week',
  monthly: 'month',
}

const axisTick = { fill: 'var(--color-muted-foreground)', fontSize: 11 }

function formatCount(value: number): string {
  return value.toLocaleString('en-NG')
}

function formatAverage(value: number): string {
  return value.toLocaleString('en-NG', { maximumFractionDigits: 1 })
}

function isTrendDatum(value: unknown): value is TrendDatum {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as { label?: unknown; count?: unknown }
  return typeof candidate.label === 'string' && typeof candidate.count === 'number'
}

interface TrendTooltipProps {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: unknown }>
  granularity: DashboardTrendGranularity
}

function TrendTooltip({ active, payload, granularity }: TrendTooltipProps) {
  if (!active) return null
  const datum = payload?.[0]?.payload
  if (!isTrendDatum(datum)) return null
  return (
    <div className={`rounded-lg bg-card px-3 py-2 ${cardShadow}`}>
      <p className="text-xs font-semibold text-foreground">{datum.label}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {formatCount(datum.count)} {datum.count === 1 ? 'enrollment' : 'enrollments'} this {GRANULARITY_NOUN[granularity]}
      </p>
    </div>
  )
}

interface EnrollmentTrendChartProps {
  points: DashboardTrendPoint[]
  average: number
  granularity: DashboardTrendGranularity
}

export function EnrollmentTrendChart({ points, average, granularity }: EnrollmentTrendChartProps) {
  const series = toTrendSeries(points)
  if (series.length === 0) return <DashboardEmptyState>No enrollment trend is available for this period.</DashboardEmptyState>

  const peak = series.reduce((best, point) => (point.count > best.count ? point : best), series[0])

  return (
    <div className="w-full min-w-0 p-4 pl-1">
      <p className="sr-only">
        Enrollment trend by {GRANULARITY_NOUN[granularity]} across {series.length}{' '}
        {series.length === 1 ? 'period' : 'periods'}, averaging {formatAverage(average)} enrollments, peaking at{' '}
        {formatCount(peak.count)} in {peak.label}.
      </p>
      <ResponsiveContainer height={288} width="100%">
        <AreaChart accessibilityLayer data={series} margin={{ bottom: 4, left: 8, right: 16, top: 16 }}>
          <defs>
            <linearGradient id="enrollmentTrendFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.16} />
              <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-border)" strokeWidth={1} vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="label"
            interval="preserveStartEnd"
            tick={axisTick}
            tickLine={false}
            tickMargin={10}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            domain={[0, 'auto']}
            tick={axisTick}
            tickFormatter={formatCount}
            tickLine={false}
            tickMargin={8}
            width={48}
          />
          <ReferenceLine
            label={{
              fill: 'var(--color-muted-foreground)',
              fontSize: 11,
              position: 'insideTopRight',
              value: `Avg ${formatAverage(average)}`,
            }}
            stroke="var(--color-muted-foreground)"
            strokeDasharray="5 5"
            strokeWidth={1}
            y={average}
          />
          <Tooltip
            content={(tooltipProps) => <TrendTooltip {...tooltipProps} granularity={granularity} />}
            cursor={{ stroke: 'var(--color-muted-foreground)', strokeWidth: 1 }}
          />
          <Area
            activeDot={{ fill: 'var(--color-chart-1)', r: 5, stroke: 'var(--color-card)', strokeWidth: 2 }}
            dataKey="count"
            dot={{ fill: 'var(--color-chart-1)', r: 4, stroke: 'var(--color-card)', strokeWidth: 2 }}
            fill="url(#enrollmentTrendFill)"
            isAnimationActive={false}
            name="Enrollments"
            stroke="var(--color-chart-1)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            type="monotone"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
