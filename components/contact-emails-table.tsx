import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmailPreviewButton } from '@/components/email-preview-button';
import { EmailStatusIcons } from '@/components/email-status-icons';
import { formatRelativeTime } from '@/lib/format-relative-time';
import type { PopulatedEmailSubmission } from '@/lib/types';

export function ContactEmailsTable({ submissions }: { submissions: PopulatedEmailSubmission[] }) {
  if (submissions.length === 0) {
    return <p className="text-sm text-muted-foreground">No emails sent to this contact yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-none ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job</TableHead>
            <TableHead className="hidden sm:table-cell">Template</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden sm:table-cell">Sent</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((submission) => (
            <TableRow key={submission._id}>
              <TableCell className="font-medium">
                {submission.job?.title ?? <span className="text-muted-foreground italic">Deleted job</span>}
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {submission.emailTemplateId?.label ?? '—'}
              </TableCell>
              <TableCell>
                <EmailStatusIcons submission={submission} />
              </TableCell>
              <TableCell
                className="hidden text-xs whitespace-nowrap text-muted-foreground sm:table-cell"
                title={new Date(submission.emailSentAt ?? submission.createdAt).toLocaleString('en-US')}
              >
                {formatRelativeTime(submission.emailSentAt ?? submission.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                {submission.emailTemplateId ? (
                  <EmailPreviewButton
                    template={submission.emailTemplateId}
                    contact={submission.contact}
                    job={submission.job}
                  />
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
