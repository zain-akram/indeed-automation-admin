'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { isStatsRangeValue, rangeLabel, STATS_RANGES, type StatsRangeValue } from '@/lib/stats-range';

export function StatsRangeSwitcher({ value }: { value: StatsRangeValue }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function handleChange(next: string | null) {
    if (!next || !isStatsRangeValue(next)) {
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set('range', next);
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <Select value={value} onValueChange={handleChange} disabled={pending}>
      <SelectTrigger className="w-40" size="sm">
        <SelectValue>{() => rangeLabel(value)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {STATS_RANGES.map((range) => (
          <SelectItem key={range.value} value={range.value}>
            {range.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
