export function formatHouseholdCode(wardCode: string, sequence: number) {
  return `${wardCode}-${String(sequence).padStart(3, '0')}`
}
