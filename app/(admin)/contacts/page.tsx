import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ContactsTable } from '@/components/contacts-table';
import { getContactsPage } from '@/lib/actions/contacts';

const PAGE_SIZE = 50;

export default async function ContactsPage() {
  const { items, total } = await getContactsPage({ limit: PAGE_SIZE });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Contacts</h1>
        <Button render={<Link href="/contacts/new" />} nativeButton={false}>
          New Contact
        </Button>
      </div>

      {total === 0 ? (
        <p className="text-sm text-muted-foreground">No contacts yet.</p>
      ) : (
        <ContactsTable initialItems={items} initialTotal={total} pageSize={PAGE_SIZE} />
      )}
    </div>
  );
}
