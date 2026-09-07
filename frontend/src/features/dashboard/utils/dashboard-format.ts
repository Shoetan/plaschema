export function formatDashboardDate(value: string | null, includeTime = false): string {
  if (!value) return 'Not available'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not available'
  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeZone: 'Africa/Lagos',
    ...(includeTime ? { timeStyle: 'short' } : {}),
  }).format(date)
}

export function signedValue(value: number, suffix = ''): string {
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${value.toLocaleString('en-NG', { maximumFractionDigits: 1 })}${suffix}`
}

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || '—'
}
