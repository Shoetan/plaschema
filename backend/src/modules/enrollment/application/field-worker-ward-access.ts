/**
 * Field workers with no assigned wards may access every ward.
 * Field workers with one or more assignments are scoped to those wards only.
 */
export function fieldWorkerCanAccessWard(
  assignedWards: readonly { id: string }[],
  wardId: string,
): boolean {
  if (assignedWards.length === 0) {
    return true;
  }
  return assignedWards.some((ward) => ward.id === wardId);
}

/**
 * Returns ward IDs to filter list queries by, or `undefined` for no restriction.
 */
export function fieldWorkerWardListFilter(
  assignedWards: readonly { id: string }[],
): string[] | undefined {
  if (assignedWards.length === 0) {
    return undefined;
  }
  return assignedWards.map((ward) => ward.id);
}
