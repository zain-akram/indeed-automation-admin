import {
  CircleCheckIcon,
  CircleXIcon,
  MailCheckIcon,
  MailOpenIcon,
  MousePointerClickIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import type { PopulatedEmailSubmission } from '@/lib/types';

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
    <div className="flex flex-wrap items-center gap-1.5">
      {submission.emailDeliveredAt ? (
        <span title="Delivered" aria-label="Delivered" className="inline-flex">
          <MailCheckIcon className="size-4 text-muted-foreground" />
        </span>
      ) : null}
      {submission.emailOpenedAt ? (
        <span title="Opened" aria-label="Opened" className="inline-flex">
          <MailOpenIcon className="size-4 text-muted-foreground" />
        </span>
      ) : null}
      {submission.emailClickedAt ? (
        <span title="Clicked" aria-label="Clicked" className="inline-flex">
          <MousePointerClickIcon className="size-4 text-muted-foreground" />
        </span>
      ) : null}
      {submission.emailBouncedAt ? (
        <span title="Bounced" aria-label="Bounced" className="inline-flex">
          <TriangleAlertIcon className="size-4 text-destructive" />
        </span>
      ) : null}
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
