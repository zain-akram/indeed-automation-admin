import { CircleCheckIcon, CircleDashedIcon, CircleXIcon, type LucideIcon } from 'lucide-react';
import type { PopulatedSubmission } from '@/lib/types';

function describeStatus(submission: PopulatedSubmission): { label: string; icon: LucideIcon; className: string } {
  if (submission.status === 'sent') {
    return { label: 'WhatsApp Sent', icon: CircleCheckIcon, className: 'text-foreground' };
  }
  if (submission.status === 'failed') {
    return { label: 'WhatsApp Failed', icon: CircleXIcon, className: 'text-destructive' };
  }
  if (submission.emailStatus === 'sent') {
    return { label: 'Email Sent', icon: CircleCheckIcon, className: 'text-foreground' };
  }
  if (submission.emailStatus === 'failed') {
    return { label: 'Email Failed', icon: CircleXIcon, className: 'text-destructive' };
  }
  return { label: 'Not Contacted', icon: CircleDashedIcon, className: 'text-muted-foreground' };
}

function templateUsed(submission: PopulatedSubmission): string | null {
  if (submission.status === 'sent' || submission.status === 'failed') {
    return submission.templateKey ?? null;
  }
  if (submission.emailStatus === 'sent' || submission.emailStatus === 'failed') {
    return submission.emailTemplateId?.label ?? null;
  }
  return null;
}

/**
 * Unlike SubmissionStatusBadge (which shows the raw WhatsApp-only status field), this looks at
 * both channels to explain what "skipped" actually means for a given row — most importantly, that
 * an imported application with neither channel attempted yet just hasn't been contacted, not failed.
 */
export function CandidateStatus({
  submission,
  showTemplate = false,
}: {
  submission: PopulatedSubmission;
  /** Set when the table has no separate "Template" column, so this is the only place it'd show. */
  showTemplate?: boolean;
}) {
  const { label, icon: Icon, className } = describeStatus(submission);
  const template = showTemplate ? templateUsed(submission) : null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs whitespace-nowrap ${className}`}
      title={template ? `Template: ${template}` : undefined}
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </span>
  );
}
