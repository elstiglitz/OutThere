import { SPOT_STATUSES, SPOT_TYPES, type Spot, type SpotStatus, type SpotType } from '../types'

export interface FilterState {
  types: Set<SpotType>
  statuses: Set<SpotStatus>
  dogsOnly: boolean
}

export const ALL_FILTERS: FilterState = {
  types: new Set(SPOT_TYPES.map((t) => t.value)),
  statuses: new Set(SPOT_STATUSES.map((s) => s.value)),
  dogsOnly: false,
}

export function matchesFilters(s: Spot, f: FilterState): boolean {
  return f.types.has(s.type) && f.statuses.has(s.status) && (!f.dogsOnly || s.details.dogs === 'Yes')
}
