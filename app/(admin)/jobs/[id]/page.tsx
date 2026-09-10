import { FileTextIcon } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BreadcrumbLabel } from '@/components/breadcrumb-label';
import { CandidateStatus } from '@/components/candidate-status';
import { EmailInviteDialog } from '@/components/email-invite-dialog';
import { EmailTrackingIcons } from '@/components/email-status-icons';
import { IndeedIcon } from '@/components/indeed-icon';
import { SubmissionRowActions } from '@/components/submission-row-actions';
import { WhatsappInviteDialog } from '@/components/whatsapp-invite-dialog';
import { getEmailTemplates } from '@/lib/actions/email-templates';
import { getJob } from '@/lib/actions/jobs';
import { getSubmissions } from '@/lib/actions/submissions';
import { getActiveWhatsappAccount, getWhatsappAccounts } from '@/lib/actions/whatsapp-accounts';
import { formatRelativeTime } from '@/lib/format-relative-time';
import { getIndeedCandidateUrl } from '@/lib/indeed';
import type { TemplateDef } from '@/lib/types';

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [job, submissions, whatsappAccounts, activeAccount, emailTemplates] = await Promise.all([
    getJob(id),
    getSubmissions({ jobId: id }),
    getWhatsappAccounts(),
    getActiveWhatsappAccount(),
    getEmailTemplates(),
  ]);

  const templatesByAccount: Record<string, TemplateDef[]> = {};
  for (const account of whatsappAccounts) {
    templatesByAccount[account._id] = account.templates ?? [];
  }

  return (
    <div className="flex flex-col gap-6">
      <BreadcrumbLabel path={`/jobs/${id}`} label={job.title} />
      <div>
        <h1 className="text-xl font-semibold">{job.title}</h1>
        <Badge variant={job.isActive ? 'default' : 'secondary'}>{job.isActive ? 'Active' : 'Inactive'}</Badge>
      </div>

      {job.description ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{job.description}</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Submissions for this Job</h2>
        {submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No submissions for this job yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-none ring-1 ring-foreground/10">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Person</TableHead>
                  <TableHead className="hidden md:table-cell">WhatsApp</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Email Tracking</TableHead>
                  <TableHead className="hidden lg:table-cell">Milestone</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => {
                  const indeedCandidateUrl = getIndeedCandidateUrl(submission.resumeUrl);
                  return (
                    <TableRow key={submission._id}>
                      <TableCell className="font-medium">
                        {submission.contact ? (
                          <Link href={`/contacts/${submission.contact._id}`} className="hover:underline">
                            {submission.contact.firstName} {submission.contact.lastName}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground italic">Deleted contact</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{submission.contact?.whatsapp ?? '—'}</TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {submission.contact?.email ?? '—'}
                      </TableCell>
                      <TableCell>
                        <CandidateStatus submission={submission} showTemplate />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <EmailTrackingIcons submission={submission} />
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">
                        {submission.milestone ?? '—'}
                      </TableCell>
                      <TableCell
                        className="hidden text-xs whitespace-nowrap text-muted-foreground sm:table-cell"
                        title={new Date(submission.appliedAt ?? submission.createdAt).toLocaleString()}
                      >
                        {formatRelativeTime(submission.appliedAt ?? submission.createdAt)}
                      </TableCell>
                      <TableCell className="flex flex-wrap justify-end gap-1 text-right">
                        {submission.resumeUrl ? (
                          <Button
                            render={<a href={submission.resumeUrl} target="_blank" rel="noopener noreferrer" />}
                            nativeButton={false}
                            variant="ghost"
                            size="icon-sm"
                            title="View resume"
                          >
                            <FileTextIcon className="size-4" />
                          </Button>
                        ) : null}
                        {indeedCandidateUrl ? (
                          <Button
                            render={<a href={indeedCandidateUrl} target="_blank" rel="noopener noreferrer" />}
                            nativeButton={false}
                            variant="ghost"
                            size="icon-sm"
                            title="View on Indeed"
                          >
                            <IndeedIcon className="size-4" />
                          </Button>
                        ) : null}
                        {submission.contact ? (
                          <>
                            <WhatsappInviteDialog
                              job={job}
                              contact={submission.contact}
                              whatsappAccounts={whatsappAccounts}
                              templatesByAccount={templatesByAccount}
                              defaultWhatsappAccountId={activeAccount?._id}
                            />
                            <EmailInviteDialog
                              job={job}
                              contact={submission.contact}
                              emailTemplates={emailTemplates}
                              whatsappAccounts={whatsappAccounts}
                            />
                          </>
                        ) : null}
                        <SubmissionRowActions
                          submissionId={submission._id}
                          message={submission.renderedMessage}
                          title={`Message to ${submission.contact ? `${submission.contact.firstName} ${submission.contact.lastName}` : 'deleted contact'}`}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
