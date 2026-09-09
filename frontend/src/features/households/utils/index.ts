import type { HouseholdListItem } from '../types'

export function householdSize(item: Pick<HouseholdListItem, 'headName' | 'memberCount'>) {
  return (item.headName ? 1 : 0) + item.memberCount
}

export function formatHouseholdDate(value: string | null, withTime = false) {
  if (!value) return 'Not available'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not available'
  return new Intl.DateTimeFormat('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    timeZone: 'Africa/Lagos',
  }).format(date)
}

export function memberDisplayName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim()
}

export function householdStatusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}
