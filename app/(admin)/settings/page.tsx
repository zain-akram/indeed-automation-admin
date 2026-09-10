import { SettingsForm } from '@/components/settings-form';
import { getJobs } from '@/lib/actions/jobs';
import { getSettings } from '@/lib/actions/settings';
import {
  getWhatsappAccounts,
  testWhatsappAccountCredentials,
  type WhatsappTestResult,
} from '@/lib/actions/whatsapp-accounts';

export default async function SettingsPage() {
  const [settings, jobs, whatsappAccounts] = await Promise.all([getSettings(), getJobs(), getWhatsappAccounts()]);

  const testResultPairs = await Promise.all(
    whatsappAccounts.map(
      async (account) =>
        [
          account._id,
          await testWhatsappAccountCredentials(account.whatsappApiToken, account.whatsappPhoneNumberId),
        ] as [string, WhatsappTestResult],
    ),
  );

  const initialTestResults = Object.fromEntries(testResultPairs);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Settings</h1>
      <SettingsForm
        settings={settings}
        jobs={jobs}
        whatsappAccounts={whatsappAccounts}
        initialTestResults={initialTestResults}
      />
    </div>
  );
}
