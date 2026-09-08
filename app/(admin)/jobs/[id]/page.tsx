import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ViewMessageButton } from '@/components/view-message-button';
import { getJob } from '@/lib/actions/jobs';
import { getSubmissions } from '@/lib/actions/submissions';

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [job, submissions] = await Promise.all([getJob(id), getSubmissions({ jobId: id })]);

  return (
    <div className="flex flex-col gap-6">
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
        <h2 className="text-sm font-medium text-muted-foreground">Interviews for this Job</h2>
        {submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No interview invites sent for this job yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-none ring-1 ring-foreground/10">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Person</TableHead>
                  <TableHead>WhatsApp</TableHead>
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
                      {submission.contact ? (
                        <Link href={`/contacts/${submission.contact._id}`} className="hover:underline">
                          {submission.contact.firstName} {submission.contact.lastName}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground italic">Deleted contact</span>
                      )}
                    </TableCell>
                    <TableCell>{submission.contact?.whatsapp ?? '—'}</TableCell>
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
    </div>
  );
}
