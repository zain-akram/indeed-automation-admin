import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmailTemplatesManager } from '@/components/email-templates-manager';
import { getEmailTemplates } from '@/lib/actions/email-templates';
import { getEmailStats } from '@/lib/actions/submissions';

export default async function EmailTemplatesPage() {
  const [templates, emailStats] = await Promise.all([getEmailTemplates(), getEmailStats()]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Email Templates</h1>
          <p className="text-sm text-muted-foreground">
            Each template can be picked when sending a follow-up email. The one marked Default is pre-selected on the
            New Interview form.
          </p>
        </div>
        <Button render={<Link href="/email-templates/new" />} nativeButton={false}>
          New Email Template
        </Button>
      </div>
      <EmailTemplatesManager templates={templates} stats={emailStats.byTemplate} />
    </div>
  );
}
