import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
                <TableHead className="hidden sm:table-cell">Sent</TableHead>
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
                  <TableCell>{submission.templateKey}</TableCell>
                  <TableCell>
                    <Badge variant={submission.status === 'sent' ? 'default' : 'destructive'}>{submission.status}</Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {new Date(submission.createdAt).toLocaleString()}
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
