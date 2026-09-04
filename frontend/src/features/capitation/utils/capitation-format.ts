import type { CapitationPeriod } from '../types'

export const CAPITATION_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

export const PLATEAU_LGAS = [
  'Barkin Ladi',
  'Bassa',
  'Bokkos',
  'Jos East',
  'Jos North',
  'Jos South',
  'Kanam',
  'Kanke',
  'Langtang North',
  'Langtang South',
  'Mangu',
  'Mikang',
  'Pankshin',
  "Qua'an Pan",
  'Riyom',
  'Shendam',
  'Wase',
] as const

export function currentLagosPeriod(date = new Date()): CapitationPeriod {
  const parts = new Intl.DateTimeFormat('en-GB', {
    month: 'numeric',
    year: 'numeric',
    timeZone: 'Africa/Lagos',
  }).formatToParts(date)
  return {
    month: Number(parts.find((part) => part.type === 'month')?.value),
    year: Number(parts.find((part) => part.type === 'year')?.value),
  }
}

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatLagosDate(value: string): string {
  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Lagos',
  }).format(new Date(value))
}
