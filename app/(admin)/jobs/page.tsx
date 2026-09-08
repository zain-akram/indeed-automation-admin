import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DeleteJobButton } from '@/components/delete-job-button';
import { getJobs } from '@/lib/actions/jobs';
import { getSubmissions } from '@/lib/actions/submissions';

export default async function JobsPage() {
  const [jobs, submissions] = await Promise.all([getJobs(), getSubmissions()]);

  const interviewCounts = new Map<string, number>();
  for (const submission of submissions) {
    const jobId = submission.job?._id;
    if (jobId) {
      interviewCounts.set(jobId, (interviewCounts.get(jobId) ?? 0) + 1);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Job Posts</h1>
        <Button render={<Link href="/jobs/new" />} nativeButton={false}>
          New Job
        </Button>
      </div>

      {jobs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No job posts yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-none ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden sm:table-cell">Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Interviews</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job._id}>
                  <TableCell className="font-medium">
                    <Link href={`/jobs/${job._id}`} className="hover:underline">
                      {job.title}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden max-w-xs truncate sm:table-cell">{job.description}</TableCell>
                  <TableCell>
                    <Badge variant={job.isActive ? 'default' : 'secondary'}>{job.isActive ? 'Active' : 'Inactive'}</Badge>
                  </TableCell>
                  <TableCell>{interviewCounts.get(job._id) ?? 0}</TableCell>
                  <TableCell className="flex justify-end gap-1 text-right">
                    <Button render={<Link href={`/jobs/${job._id}`} />} nativeButton={false} variant="ghost" size="sm">
                      View
                    </Button>
                    <Button
                      render={<Link href={`/jobs/${job._id}/edit`} />}
                      nativeButton={false}
                      variant="ghost"
                      size="sm"
                    >
                      Edit
                    </Button>
                    <DeleteJobButton jobId={job._id} jobTitle={job.title} />
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
