export const STATS_RANGES = [
  { value: '1h', label: 'Last Hour', hours: 1 },
  { value: '3h', label: 'Last 3 Hours', hours: 3 },
  { value: '6h', label: 'Last 6 Hours', hours: 6 },
  { value: '12h', label: 'Last 12 Hours', hours: 12 },
  { value: '24h', label: 'Last 24 Hours', hours: 24 },
  { value: '7d', label: 'Last 7 Days', hours: 24 * 7 },
  { value: '30d', label: 'Last 30 Days', hours: 24 * 30 },
  { value: 'all', label: 'All Time', hours: undefined },
] as const;

export type StatsRangeValue = (typeof STATS_RANGES)[number]['value'];

export const DEFAULT_STATS_RANGE: StatsRangeValue = 'all';

export function isStatsRangeValue(value: string): value is StatsRangeValue {
  return STATS_RANGES.some((range) => range.value === value);
}

export function rangeLabel(value: StatsRangeValue): string {
  return STATS_RANGES.find((range) => range.value === value)?.label ?? 'All Time';
}

/** Undefined means "no lower bound" (All Time) — callers pass this straight through as an
 * optional `since` filter. */
export function rangeToSince(value: StatsRangeValue): Date | undefined {
  const preset = STATS_RANGES.find((range) => range.value === value);
  if (!preset?.hours) {
    return undefined;
  }
  return new Date(Date.now() - preset.hours * 60 * 60 * 1000);
}
