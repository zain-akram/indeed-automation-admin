import { EmailsTable } from '@/components/emails-table';
import { getEmailSubmissions } from '@/lib/actions/submissions';

export default async function EmailsPage() {
  const submissions = await getEmailSubmissions();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Emails</h1>
        <p className="text-sm text-muted-foreground">Every follow-up email sent, with delivery and open tracking.</p>
      </div>
      <EmailsTable submissions={submissions} />
    </div>
  );
}
