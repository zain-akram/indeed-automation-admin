import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ViewMessageButton } from '@/components/view-message-button';
import { getContact } from '@/lib/actions/contacts';
import { getSubmissions } from '@/lib/actions/submissions';

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [contact, submissions] = await Promise.all([getContact(id), getSubmissions({ contactId: id })]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">
          {contact.firstName} {contact.lastName}
        </h1>
        <p className="text-sm text-muted-foreground">{contact.whatsapp}</p>
      </div>

      {contact.notes ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{contact.notes}</p>
          </CardContent>
        </Card>
      ) : null}

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
                  <TableHead className="hidden sm:table-cell">Sent</TableHead>
                  <TableHead className="text-right">Message</TableHead>
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
                    <TableCell>{submission.templateKey}</TableCell>
                    <TableCell>
                      <Badge variant={submission.status === 'sent' ? 'default' : 'destructive'}>
                        {submission.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {new Date(submission.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <ViewMessageButton
                        message={submission.renderedMessage}
                        title={`Message for ${submission.job?.title ?? 'deleted job'}`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
