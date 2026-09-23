import { EmailsTable } from '@/components/emails-table';
import { getEmailSubmissionsPage } from '@/lib/actions/submissions';

const PAGE_SIZE = 50;

export default async function EmailsPage() {
  const { items, total } = await getEmailSubmissionsPage({ limit: PAGE_SIZE });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Emails</h1>
        <p className="text-sm text-muted-foreground">Every follow-up email sent, with delivery and open tracking.</p>
      </div>
      <EmailsTable initialItems={items} initialTotal={total} pageSize={PAGE_SIZE} />
    </div>
  );
}
