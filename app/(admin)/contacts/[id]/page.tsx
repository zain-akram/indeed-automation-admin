import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BreadcrumbLabel } from '@/components/breadcrumb-label';
import { ContactEmailsTable } from '@/components/contact-emails-table';
import { ContactFiles } from '@/components/contact-files';
import { NotesCard } from '@/components/notes-card';
import { ResendSubmissionButton } from '@/components/resend-submission-button';
import { SubmissionStatusBadge } from '@/components/submission-status-badge';
import { ViewMessageButton } from '@/components/view-message-button';
import { getContact, getContactFiles } from '@/lib/actions/contacts';
import { getEmailSubmissions, getSubmissions } from '@/lib/actions/submissions';

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [contact, submissions, emailSubmissions, files] = await Promise.all([
    getContact(id),
    getSubmissions({ contactId: id }),
    getEmailSubmissions({ contactId: id }),
    getContactFiles(id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <BreadcrumbLabel path={`/contacts/${id}`} label={`${contact.firstName} ${contact.lastName}`} />
      <div>
        <h1 className="text-xl font-semibold">
          {contact.firstName} {contact.lastName}
        </h1>
        <p className="text-sm text-muted-foreground">{contact.whatsapp}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Files</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactFiles contactId={id} files={files} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Interview Invites Sent</h2>
        {submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No interview invites sent to this contact yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-none ring-1 ring-foreground/10">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Sent Via</TableHead>
                  <TableHead className="hidden sm:table-cell">Sent</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission._id}>
                    <TableCell className="font-medium">
                      {submission.job ? (
                        <Link href={`/jobs/${submission.job._id}`} className="hover:underline">
                          {submission.job.title}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground italic">Deleted job</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {submission.templateKey ?? <span className="text-muted-foreground italic">Email only</span>}
                    </TableCell>
                    <TableCell>
                      <SubmissionStatusBadge status={submission.status} />
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
                    <TableCell className="flex flex-wrap justify-end gap-2 text-right">
                      <ViewMessageButton
                        message={submission.renderedMessage}
                        title={`Message for ${submission.job?.title ?? 'deleted job'}`}
                      />
                      <ResendSubmissionButton submissionId={submission._id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Emails Sent</h2>
        <ContactEmailsTable submissions={emailSubmissions} />
      </div>

      {contact.notes ? <NotesCard notes={contact.notes} /> : null}
    </div>
  );
}
