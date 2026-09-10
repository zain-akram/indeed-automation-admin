import { CircleCheckIcon, CircleDashedIcon, CircleXIcon } from 'lucide-react';
import type { SubmissionStatus } from '@/lib/types';

const STATUS_CONFIG: Record<SubmissionStatus, { icon: typeof CircleCheckIcon; className: string }> = {
  sent: { icon: CircleCheckIcon, className: 'text-foreground' },
  failed: { icon: CircleXIcon, className: 'text-destructive' },
  skipped: { icon: CircleDashedIcon, className: 'text-muted-foreground' },
};

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  const { icon: Icon, className } = STATUS_CONFIG[status];
  return (
    <span title={status} aria-label={status} className="inline-flex">
      <Icon className={`size-4 ${className}`} />
    </span>
  );
}
