import { InterviewForm } from '@/components/interview-form';
import { getContacts } from '@/lib/actions/contacts';
import { getJobs } from '@/lib/actions/jobs';
import { getSettings } from '@/lib/actions/settings';
import { getTemplates } from '@/lib/actions/templates';

export default async function NewInterviewPage() {
  const [jobs, contacts, templates, settings] = await Promise.all([
    getJobs(),
    getContacts(),
    getTemplates(),
    getSettings(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">New Interview Submission</h1>
      <InterviewForm
        jobs={jobs}
        contacts={contacts}
        templates={templates}
        defaultInterviewLink={settings.defaultInterviewLink}
        defaultJobId={settings.defaultJobId}
      />
    </div>
  );
}
