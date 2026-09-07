import { Cell, Label, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { cardShadow } from '@/components/admin/styles'

import type { DashboardStatusBreakdown } from '../types'
import { toStatusSeries, type StatusDatum } from '../utils'

import { DashboardEmptyState } from './dashboard-empty-state'

const SLICE_COLORS = ['var(--color-chart-1)', 'var(--color-chart-2)']

function formatCount(value: number): string {
  return value.toLocaleString('en-NG')
}

function formatPercent(value: number): string {
  return `${value.toLocaleString('en-NG', { maximumFractionDigits: 1 })}%`
}

function isStatusDatum(value: unknown): value is StatusDatum {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as { name?: unknown; count?: unknown; percent?: unknown }
  return typeof candidate.name === 'string' && typeof candidate.count === 'number' && typeof candidate.percent === 'number'
}

interface StatusTooltipProps {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: unknown }>
}

function StatusTooltip({ active, payload }: StatusTooltipProps) {
  if (!active) return null
  const datum = payload?.[0]?.payload
  if (!isStatusDatum(datum)) return null
  return (
    <div className={`rounded-lg bg-card px-3 py-2 ${cardShadow}`}>
      <p className="text-xs font-semibold text-foreground">{datum.name}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {formatCount(datum.count)} beneficiaries · {formatPercent(datum.percent)}
      </p>
    </div>
  )
}

interface DonutTotalProps {
  viewBox?: unknown
  total: number
}

function hasCenter(value: unknown): value is { cx: number; cy: number } {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as { cx?: unknown; cy?: unknown }
  return typeof candidate.cx === 'number' && typeof candidate.cy === 'number'
}

function DonutTotal({ viewBox, total }: DonutTotalProps) {
  if (!hasCenter(viewBox)) return null
  const { cx, cy } = viewBox
  return (
    <>
      <text className="fill-foreground text-lg font-semibold" textAnchor="middle" x={cx} y={cy - 2}>
        {formatCount(total)}
      </text>
      <text className="fill-muted-foreground text-[11px]" textAnchor="middle" x={cx} y={cy + 15}>
        Total
      </text>
    </>
  )
}

interface EnrollmentStatusDonutProps {
  breakdown: DashboardStatusBreakdown
}

export function EnrollmentStatusDonut({ breakdown }: EnrollmentStatusDonutProps) {
  const series = toStatusSeries(breakdown)
  const total = series.reduce((sum, slice) => sum + slice.count, 0)
  if (total === 0) return <DashboardEmptyState>No beneficiary status data is available.</DashboardEmptyState>

  return (
    <div className="grid gap-5 p-4 sm:grid-cols-[192px_minmax(0,1fr)] sm:items-center">
      <div className="w-full min-w-0">
        <p className="sr-only">
          {series.map((slice) => `${slice.name}: ${formatCount(slice.count)} (${formatPercent(slice.percent)})`).join('. ')}
        </p>
        <ResponsiveContainer height={192} width="100%">
          <PieChart accessibilityLayer margin={{ bottom: 0, left: 0, right: 0, top: 0 }}>
            <Tooltip content={(tooltipProps) => <StatusTooltip {...tooltipProps} />} />
            <Pie
              data={series}
              dataKey="count"
              innerRadius={60}
              isAnimationActive={false}
              nameKey="name"
              outerRadius={84}
              paddingAngle={2}
              stroke="var(--color-card)"
              strokeWidth={2}
            >
              {series.map((slice, index) => (
                <Cell fill={SLICE_COLORS[index % SLICE_COLORS.length]} key={slice.name} />
              ))}
              <Label content={(labelProps) => <DonutTotal {...labelProps} total={total} />} position="center" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex flex-col gap-3">
        {series.map((slice, index) => (
          <li className="flex items-center gap-3" key={slice.name}>
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: SLICE_COLORS[index % SLICE_COLORS.length] }}
            />
            <span className="flex-1 text-xs text-muted-foreground">{slice.name}</span>
            <span className="text-xs font-semibold tabular-nums">{formatCount(slice.count)}</span>
            <span className="w-14 text-right text-xs text-muted-foreground tabular-nums">{formatPercent(slice.percent)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
