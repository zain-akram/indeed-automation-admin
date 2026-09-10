import { formatDistanceToNow } from 'date-fns';

/** Like date-fns's formatDistanceToNow, but without the "about" hedge word (e.g. "3 hours ago" not "about 3 hours ago"). */
export function formatRelativeTime(date: Date | string | number): string {
  return formatDistanceToNow(date, { addSuffix: true }).replace(/^about /, '');
}
