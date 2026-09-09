import { SettingsForm } from '@/components/settings-form';
import { getJobs } from '@/lib/actions/jobs';
import { getSettings, syncWhatsappTemplates, testWhatsappCredentials } from '@/lib/actions/settings';

export default async function SettingsPage() {
  const [settings, jobs] = await Promise.all([getSettings(), getJobs()]);
  const [initialConnectionStatus, initialTemplateSync] = await Promise.all([
    settings.whatsappApiToken && settings.whatsappPhoneNumberId
      ? testWhatsappCredentials(settings.whatsappApiToken, settings.whatsappPhoneNumberId)
      : Promise.resolve(null),
    settings.whatsappApiToken && settings.whatsappBusinessId ? syncWhatsappTemplates() : Promise.resolve(null),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Settings</h1>
      <SettingsForm
        settings={settings}
        jobs={jobs}
        initialConnectionStatus={initialConnectionStatus}
        initialTemplateSync={initialTemplateSync}
      />
    </div>
  );
}
