import { SPOT_STATUSES, SPOT_TYPES, type SpotStatus, type SpotType } from '../types'

export interface FilterState {
  types: Set<SpotType>
  statuses: Set<SpotStatus>
}

export const ALL_FILTERS: FilterState = {
  types: new Set(SPOT_TYPES.map((t) => t.value)),
  statuses: new Set(SPOT_STATUSES.map((s) => s.value)),
}
