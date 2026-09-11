import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SubmissionsTable } from '@/components/submissions-table';
import { getEmailTemplates } from '@/lib/actions/email-templates';
import { getSubmissionsPage } from '@/lib/actions/submissions';
import { getActiveWhatsappAccount, getWhatsappAccounts } from '@/lib/actions/whatsapp-accounts';
import type { TemplateDef } from '@/lib/types';

const PAGE_SIZE = 50;

export default async function InterviewsPage() {
  const [submissionsPage, whatsappAccounts, activeAccount, emailTemplates] = await Promise.all([
    getSubmissionsPage({ limit: PAGE_SIZE }),
    getWhatsappAccounts(),
    getActiveWhatsappAccount(),
    getEmailTemplates(),
  ]);

  const templatesByAccount: Record<string, TemplateDef[]> = {};
  for (const account of whatsappAccounts) {
    templatesByAccount[account._id] = account.templates ?? [];
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Interviews</h1>
        <Button render={<Link href="/interviews/new" />} nativeButton={false}>
          New Interview
        </Button>
      </div>

      <SubmissionsTable
        initialItems={submissionsPage.items}
        initialTotal={submissionsPage.total}
        pageSize={PAGE_SIZE}
        whatsappAccounts={whatsappAccounts}
        defaultWhatsappAccountId={activeAccount?._id}
        emailTemplates={emailTemplates}
        templatesByAccount={templatesByAccount}
      />
    </div>
  );
}
