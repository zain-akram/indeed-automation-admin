import { NextResponse } from 'next/server';
import { BackendError } from '@/lib/backend';
import { getContacts } from '@/lib/actions/contacts';
import { toCsv } from '@/lib/csv';

// Minimal column set Google Contacts' CSV importer accepts — https://contacts.google.com's
// "Import" flow recognizes these headers and leaves the rest of its own fuller schema blank.
const HEADERS = [
  'Name',
  'Given Name',
  'Family Name',
  'E-mail 1 - Type',
  'E-mail 1 - Value',
  'Phone 1 - Type',
  'Phone 1 - Value',
  'Notes',
];

function formatPhone(whatsapp: string): string {
  return whatsapp.startsWith('+') ? whatsapp : `+${whatsapp}`;
}

export async function GET() {
  let contacts;
  try {
    contacts = await getContacts();
  } catch (error) {
    if (error instanceof BackendError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    throw error;
  }

  const rows = contacts.map((contact) => [
    `${contact.firstName} ${contact.lastName}`.trim(),
    contact.firstName,
    contact.lastName,
    contact.email ? '* Home' : '',
    contact.email ?? '',
    '* Mobile',
    formatPhone(contact.whatsapp),
    [contact.location, contact.notes].filter(Boolean).join('\n'),
  ]);

  const csv = toCsv(HEADERS, rows);
  const filename = `contacts-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
