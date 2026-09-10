import { SettingsForm } from '@/components/settings-form';
import { getJobs } from '@/lib/actions/jobs';
import { getSettings } from '@/lib/actions/settings';
import { getTemplates } from '@/lib/actions/templates';
import {
  getWhatsappAccounts,
  syncWhatsappAccountTemplates,
  testWhatsappAccountCredentials,
  type TemplateSyncResult,
  type WhatsappTestResult,
} from '@/lib/actions/whatsapp-accounts';

export default async function SettingsPage() {
  const [settings, jobs, whatsappAccounts, templates] = await Promise.all([
    getSettings(),
    getJobs(),
    getWhatsappAccounts(),
    getTemplates(),
  ]);

  const [testResultPairs, templateSyncPairs] = await Promise.all([
    Promise.all(
      whatsappAccounts.map(
        async (account) =>
          [
            account._id,
            await testWhatsappAccountCredentials(account.whatsappApiToken, account.whatsappPhoneNumberId),
          ] as [string, WhatsappTestResult],
      ),
    ),
    Promise.all(
      whatsappAccounts.map(
        async (account) =>
          [account._id, await syncWhatsappAccountTemplates(account._id)] as [string, TemplateSyncResult],
      ),
    ),
  ]);

  const initialTestResults = Object.fromEntries(testResultPairs);
  const initialTemplateSyncResults = Object.fromEntries(templateSyncPairs);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Settings</h1>
      <SettingsForm
        settings={settings}
        jobs={jobs}
        whatsappAccounts={whatsappAccounts}
        templates={templates}
        initialTestResults={initialTestResults}
        initialTemplateSyncResults={initialTemplateSyncResults}
      />
    </div>
  );
}
