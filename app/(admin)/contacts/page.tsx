import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getContacts } from '@/lib/actions/contacts';
import { getSubmissions } from '@/lib/actions/submissions';

export default async function ContactsPage() {
  const [contacts, submissions] = await Promise.all([getContacts(), getSubmissions()]);

  const interviewCounts = new Map<string, number>();
  for (const submission of submissions) {
    const contactId = submission.contact?._id;
    if (contactId) {
      interviewCounts.set(contactId, (interviewCounts.get(contactId) ?? 0) + 1);
    }
  }

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
        <div className="overflow-x-auto rounded-none ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead className="hidden sm:table-cell">Notes</TableHead>
                <TableHead>Total Interviews</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact._id}>
                  <TableCell className="font-medium">
                    <Link href={`/contacts/${contact._id}`} className="hover:underline">
                      {contact.firstName} {contact.lastName}
                    </Link>
                  </TableCell>
                  <TableCell>{contact.whatsapp}</TableCell>
                  <TableCell className="hidden max-w-xs truncate sm:table-cell">{contact.notes}</TableCell>
                  <TableCell>{interviewCounts.get(contact._id) ?? 0}</TableCell>
                  <TableCell className="flex justify-end gap-1 text-right">
                    <Button
                      render={<Link href={`/contacts/${contact._id}`} />}
                      nativeButton={false}
                      variant="ghost"
                      size="sm"
                    >
                      View
                    </Button>
                    <Button
                      render={<Link href={`/contacts/${contact._id}/edit`} />}
                      nativeButton={false}
                      variant="ghost"
                      size="sm"
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
