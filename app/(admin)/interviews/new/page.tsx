import { InterviewForm } from '@/components/interview-form';
import { getContacts } from '@/lib/actions/contacts';
import { getEmailTemplates } from '@/lib/actions/email-templates';
import { getJobs } from '@/lib/actions/jobs';
import { getSettings } from '@/lib/actions/settings';
import { getActiveWhatsappAccount, getWhatsappAccounts } from '@/lib/actions/whatsapp-accounts';
import type { TemplateDef } from '@/lib/types';

export default async function NewInterviewPage() {
  const [jobs, contacts, settings, activeAccount, whatsappAccounts, emailTemplates] = await Promise.all([
    getJobs(),
    getContacts(),
    getSettings(),
    getActiveWhatsappAccount(),
    getWhatsappAccounts(),
    getEmailTemplates(),
  ]);

  const templatesByAccount: Record<string, TemplateDef[]> = {};
  for (const account of whatsappAccounts) {
    templatesByAccount[account._id] = account.templates ?? [];
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">New Interview Submission</h1>
      <InterviewForm
        jobs={jobs}
        contacts={contacts}
        whatsappAccounts={whatsappAccounts}
        templatesByAccount={templatesByAccount}
        emailTemplates={emailTemplates}
        defaultInterviewLink={settings.defaultInterviewLink}
        defaultJobId={settings.defaultJobId}
        defaultWhatsappAccountId={activeAccount?._id}
        defaultDeliveryChannel={settings.defaultDeliveryChannel}
      />
    </div>
  );
}
