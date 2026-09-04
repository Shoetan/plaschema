import type { CapitationListParams } from '../types'

export const capitationKeys = {
  all: ['capitations'] as const,
  lists: () => [...capitationKeys.all, 'list'] as const,
  list: (params: CapitationListParams) =>
    [...capitationKeys.lists(), params] as const,
  previews: () => [...capitationKeys.all, 'preview'] as const,
  preview: (month: number, year: number) =>
    [...capitationKeys.previews(), { month, year }] as const,
}
