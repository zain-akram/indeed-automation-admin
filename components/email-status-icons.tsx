import {
  CircleCheckIcon,
  CircleXIcon,
  type LucideIcon,
  MailCheckIcon,
  MailOpenIcon,
  MousePointerClickIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import { formatRelativeTime, formatShortRelativeTime } from '@/lib/format-relative-time';
import type { PopulatedEmailSubmission } from '@/lib/types';

function TrackingBadge({
  icon: Icon,
  label,
  date,
  className,
}: {
  icon: LucideIcon;
  label: string;
  date?: string;
  className?: string;
}) {
  if (!date) {
    return null;
  }
  return (
    <span
      className="inline-flex flex-col items-center gap-0.5"
      title={`${label} ${formatRelativeTime(date)}`}
      aria-label={`${label} ${formatRelativeTime(date)}`}
    >
      <Icon className={`size-4 ${className ?? 'text-muted-foreground'}`} />
      <span className="text-[10px] leading-none text-muted-foreground" suppressHydrationWarning>
        {formatShortRelativeTime(date)}
      </span>
    </span>
  );
}

/** Delivered/opened/clicked/bounced only — the outcome of the send itself is shown separately. */
export function EmailTrackingIcons({ submission }: { submission: PopulatedEmailSubmission }) {
  if (
    !submission.emailDeliveredAt &&
    !submission.emailOpenedAt &&
    !submission.emailClickedAt &&
    !submission.emailBouncedAt
  ) {
    return null;
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <TrackingBadge icon={MailCheckIcon} label="Delivered" date={submission.emailDeliveredAt} />
      <TrackingBadge icon={MailOpenIcon} label="Opened" date={submission.emailOpenedAt} />
      <TrackingBadge icon={MousePointerClickIcon} label="Clicked" date={submission.emailClickedAt} />
      <TrackingBadge
        icon={TriangleAlertIcon}
        label="Bounced"
        date={submission.emailBouncedAt}
        className="text-destructive"
      />
    </div>
  );
}

export function EmailStatusIcons({ submission }: { submission: PopulatedEmailSubmission }) {
  const sent = submission.emailStatus === 'sent';
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span title={sent ? 'Sent' : 'Failed'} aria-label={sent ? 'Sent' : 'Failed'} className="inline-flex">
        {sent ? (
          <CircleCheckIcon className="size-4 text-foreground" />
        ) : (
          <CircleXIcon className="size-4 text-destructive" />
        )}
      </span>
      <EmailTrackingIcons submission={submission} />
    </div>
  );
}
