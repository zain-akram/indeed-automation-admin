import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CandidateStatus } from '@/components/candidate-status';
import { EmailTrackingIcons } from '@/components/email-status-icons';
import { InterviewRowActions } from '@/components/interview-row-actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getSubmissions } from '@/lib/actions/submissions';

export default async function InterviewsPage() {
  const submissions = await getSubmissions();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Interviews</h1>
        <Button render={<Link href="/interviews/new" />} nativeButton={false}>
          New Interview
        </Button>
      </div>

      {submissions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No interview submissions yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-none ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Email Tracking</TableHead>
                <TableHead className="hidden md:table-cell">Sent Via</TableHead>
                <TableHead className="hidden sm:table-cell">Sent</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission._id}>
                  <TableCell className="font-medium">
                    {submission.contact ? (
                      `${submission.contact.firstName} ${submission.contact.lastName}`
                    ) : (
                      <span className="text-muted-foreground italic">Deleted contact</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {submission.job?.title ?? <span className="text-muted-foreground italic">Deleted job</span>}
                  </TableCell>
                  <TableCell>
                    {submission.templateKey ? <div>{submission.templateKey}</div> : null}
                    {submission.emailTemplateId ? (
                      <div className="text-xs text-muted-foreground">{submission.emailTemplateId.label}</div>
                    ) : null}
                    {!submission.templateKey && !submission.emailTemplateId ? (
                      <span className="text-muted-foreground italic">—</span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <CandidateStatus submission={submission} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <EmailTrackingIcons submission={submission} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {submission.whatsappAccountId ? (
                      <span>{submission.whatsappAccountId.label}</span>
                    ) : (
                      <span className="text-muted-foreground italic">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {new Date(submission.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <InterviewRowActions
                      submissionId={submission._id}
                      message={submission.renderedMessage}
                      title={`Message to ${submission.contact ? `${submission.contact.firstName} ${submission.contact.lastName}` : 'deleted contact'}`}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
