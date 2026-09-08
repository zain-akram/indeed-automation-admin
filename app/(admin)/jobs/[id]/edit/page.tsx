import { JobForm } from '@/components/job-form';
import { getJob, updateJobAction } from '@/lib/actions/jobs';

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJob(id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Edit Job Post</h1>
      <JobForm action={updateJobAction.bind(null, id)} initial={job} submitLabel="Save Changes" showActiveToggle />
    </div>
  );
}
