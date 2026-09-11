import { formatDistanceToNow } from 'date-fns';

/** Like date-fns's formatDistanceToNow, but without the "about" hedge word (e.g. "3 hours ago" not "about 3 hours ago"). */
export function formatRelativeTime(date: Date | string | number): string {
  return formatDistanceToNow(date, { addSuffix: true }).replace(/^about /, '');
}

/** Compact relative time for tight spaces, e.g. "5m", "3h", "2d" — no "ago" suffix. */
export function formatShortRelativeTime(date: Date | string | number): string {
  const diffMs = Math.max(Date.now() - new Date(date).getTime(), 0);
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h`;
  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d`;
  const diffWeek = Math.round(diffDay / 7);
  if (diffWeek < 5) return `${diffWeek}w`;
  const diffMonth = Math.round(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}mo`;
  return `${Math.round(diffDay / 365)}y`;
}
