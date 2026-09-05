export const PLATEAU_LGAS = ['Barkin Ladi', 'Bassa', 'Bokkos', 'Jos East', 'Jos North', 'Jos South', 'Kanam', 'Kanke', 'Langtang North', 'Langtang South', 'Mangu', 'Mikang', 'Pankshin', "Qua'an Pan", 'Riyom', 'Shendam', 'Wase']

export function formatEnrollmentDate(value: string | null, includeTime = false): string {
  if (!value) return 'Not available'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not available'
  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeZone: 'Africa/Lagos',
    ...(includeTime ? { timeStyle: 'short' } : {}),
  }).format(date)
}

export function readableValue(value: string | null | undefined): string {
  if (!value) return 'Not provided'
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function statusLabel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function availableEnrollmentStatusTargets(status: EnrollmentStatus): EnrollmentStatusTarget[] {
  if (status === 'pending') return ['active', 'disabled']
  if (status === 'active') return ['disabled']
  if (status === 'disabled') return ['active']
  return []
}

export function downloadFromUrl(url: string, filename: string): void {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.target = '_blank'
  anchor.rel = 'noopener noreferrer'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
}
import type { EnrollmentStatus, EnrollmentStatusTarget } from '../types'
