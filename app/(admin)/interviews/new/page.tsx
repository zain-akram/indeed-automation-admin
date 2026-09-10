import { InterviewForm } from '@/components/interview-form';
import { getContacts } from '@/lib/actions/contacts';
import { getJobs } from '@/lib/actions/jobs';
import { getSettings } from '@/lib/actions/settings';
import { getTemplates } from '@/lib/actions/templates';
import {
  getActiveWhatsappAccount,
  getWhatsappAccounts,
  syncWhatsappAccountTemplates,
} from '@/lib/actions/whatsapp-accounts';
import type { TemplateDef } from '@/lib/types';

export default async function NewInterviewPage() {
  const [jobs, contacts, templates, settings, activeAccount, whatsappAccounts] = await Promise.all([
    getJobs(),
    getContacts(),
    getTemplates(),
    getSettings(),
    getActiveWhatsappAccount(),
    getWhatsappAccounts(),
  ]);

  const templateSyncPairs = await Promise.all(
    whatsappAccounts.map(async (account) => [account._id, await syncWhatsappAccountTemplates(account._id)] as const),
  );

  const templatesByAccount: Record<string, TemplateDef[]> = {};
  for (const [accountId, sync] of templateSyncPairs) {
    templatesByAccount[accountId] =
      sync.success && sync.templates
        ? templates.filter((t) => sync.templates!.some((mt) => mt.name === t.key))
        : templates;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">New Interview Submission</h1>
      <InterviewForm
        jobs={jobs}
        contacts={contacts}
        templates={templates}
        whatsappAccounts={whatsappAccounts}
        templatesByAccount={templatesByAccount}
        defaultInterviewLink={settings.defaultInterviewLink}
        defaultJobId={settings.defaultJobId}
        defaultWhatsappAccountId={activeAccount?._id}
      />
    </div>
  );
}
