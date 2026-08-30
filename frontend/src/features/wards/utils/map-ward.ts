import type {
  CreatedWard,
  CreatedWardApi,
  WardBatchResult,
  WardListItem,
  WardListItemApi,
} from '../types/ward.types'

function countOrZero(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

export function mapCreatedWard(ward: CreatedWardApi): CreatedWard {
  return {
    id: ward.id,
    name: ward.name,
    lga: ward.lga,
    createdAt: ward.createdAt,
    updatedAt: ward.updatedAt,
  }
}

export function isWardBatchResult(value: unknown): value is WardBatchResult {
  if (typeof value !== 'object' || value === null) return false

  const result = value as Partial<WardBatchResult>
  return (
    typeof result.created === 'number' &&
    typeof result.failed === 'number' &&
    Array.isArray(result.errors)
  )
}

export function mapWardListItem(ward: WardListItemApi): WardListItem {
  return {
    id: ward.id,
    name: ward.name,
    state: ward.state ?? 'Plateau',
    lga: ward.lga,
    fieldWorkers: countOrZero(ward.fieldWorkers),
    beneficiaries: countOrZero(ward.beneficiaries),
    newEnrollments: countOrZero(ward.newEnrollments),
    status: ward.status ?? 'active',
  }
}
