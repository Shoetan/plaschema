import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { cardShadow } from '@/components/admin/styles'

import type { EnrollmentBarItem } from '../utils'

import { DashboardEmptyState } from './dashboard-empty-state'

const ROW_HEIGHT = 44
const axisTick = { fill: 'var(--color-muted-foreground)', fontSize: 11 }

function formatCount(value: number): string {
  return value.toLocaleString('en-NG')
}

function formatBarLabel(value: unknown): string {
  return typeof value === 'number' ? formatCount(value) : ''
}

function isBarItem(value: unknown): value is EnrollmentBarItem {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as { id?: unknown; label?: unknown; count?: unknown }
  return typeof candidate.id === 'string' && typeof candidate.label === 'string' && typeof candidate.count === 'number'
}

interface BarTooltipProps {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: unknown }>
}

function BarTooltip({ active, payload }: BarTooltipProps) {
  if (!active) return null
  const datum = payload?.[0]?.payload
  if (!isBarItem(datum)) return null
  return (
    <div className={`rounded-lg bg-card px-3 py-2 ${cardShadow}`}>
      <p className="text-xs font-semibold text-foreground">{datum.label}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {formatCount(datum.count)} {datum.count === 1 ? 'enrollment' : 'enrollments'}
      </p>
    </div>
  )
}

interface EnrollmentBarChartProps {
  items: EnrollmentBarItem[]
  emptyText: string
  onSelect?: (id: string) => void
  labelWidth?: number
}

export function EnrollmentBarChart({ items, emptyText, onSelect, labelWidth = 150 }: EnrollmentBarChartProps) {
  if (items.length === 0) return <DashboardEmptyState>{emptyText}</DashboardEmptyState>

  return (
    <div className="w-full min-w-0 p-4">
      {onSelect ? (
        <ul className="sr-only">
          {items.map((item) => (
            <li key={item.id}>
              <button onClick={() => onSelect(item.id)} type="button">
                {item.label}: {formatCount(item.count)} enrollments
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="sr-only">{items.map((item) => `${item.label}: ${formatCount(item.count)}`).join('. ')}</p>
      )}
      <ResponsiveContainer height={Math.max(140, items.length * ROW_HEIGHT + 24)} width="100%">
        <BarChart accessibilityLayer data={items} layout="vertical" margin={{ bottom: 4, left: 0, right: 48, top: 4 }}>
          <XAxis allowDecimals={false} hide type="number" />
          <YAxis
            axisLine={false}
            dataKey="label"
            tick={axisTick}
            tickLine={false}
            tickMargin={8}
            type="category"
            width={labelWidth}
          />
          <Tooltip content={(tooltipProps) => <BarTooltip {...tooltipProps} />} cursor={{ fill: 'var(--color-muted)', fillOpacity: 0.5 }} />
          <Bar
            barSize={16}
            className={onSelect ? 'cursor-pointer' : undefined}
            dataKey="count"
            fill="var(--color-chart-1)"
            isAnimationActive={false}
            name="Enrollments"
            onClick={(entry: unknown) => {
              if (!onSelect) return
              const datum = isBarItem(entry) ? entry : (entry as { payload?: unknown })?.payload
              if (isBarItem(datum)) onSelect(datum.id)
            }}
            radius={[0, 4, 4, 0]}
          >
            <LabelList
              className="fill-foreground text-[11px] font-semibold"
              dataKey="count"
              formatter={formatBarLabel}
              offset={8}
              position="right"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
