import { JobForm } from '@/components/job-form';
import { createJobAction } from '@/lib/actions/jobs';

export default function NewJobPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">New Job Post</h1>
      <JobForm action={createJobAction} submitLabel="Create Job" />
    </div>
  );
}
