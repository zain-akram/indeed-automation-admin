import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ContactsTable } from '@/components/contacts-table';
import { getContacts } from '@/lib/actions/contacts';
import { getSubmissions } from '@/lib/actions/submissions';

export default async function ContactsPage() {
  const [contacts, submissions] = await Promise.all([getContacts(), getSubmissions()]);

  const interviewCounts = new Map<string, number>();
  const latestResumeUrl = new Map<string, string>();
  for (const submission of submissions) {
    const contactId = submission.contact?._id;
    if (!contactId) {
      continue;
    }
    interviewCounts.set(contactId, (interviewCounts.get(contactId) ?? 0) + 1);
    if (submission.resumeUrl && !latestResumeUrl.has(contactId)) {
      latestResumeUrl.set(contactId, submission.resumeUrl);
    }
  }

  const rows = contacts.map((contact) => ({
    ...contact,
    interviewCount: interviewCounts.get(contact._id) ?? 0,
    resumeUrl: latestResumeUrl.get(contact._id),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Contacts</h1>
        <Button render={<Link href="/contacts/new" />} nativeButton={false}>
          New Contact
        </Button>
      </div>

      {contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No contacts yet.</p>
      ) : (
        <ContactsTable contacts={rows} />
      )}
    </div>
  );
}
