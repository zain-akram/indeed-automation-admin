import { NextResponse } from 'next/server';
import { BackendError } from '@/lib/backend';
import { getContacts } from '@/lib/actions/contacts';
import { toCsv } from '@/lib/csv';

// Google Contacts' current CSV import format (contacts.google.com → Import). Columns this export
// doesn't have data for are left blank — Google's importer accepts a sparse row as long as the
// header names and order match exactly.
const HEADERS = [
  'Name Prefix',
  'First Name',
  'Middle Name',
  'Last Name',
  'Name Suffix',
  'Phonetic First Name',
  'Phonetic Middle Name',
  'Phonetic Last Name',
  'Nickname',
  'File As',
  'E-mail 1 - Label',
  'E-mail 1 - Value',
  'Phone 1 - Label',
  'Phone 1 - Value',
  'Address 1 - Label',
  'Address 1 - Country',
  'Address 1 - Street',
  'Address 1 - Extended Address',
  'Address 1 - City',
  'Address 1 - Region',
  'Address 1 - Postal Code',
  'Address 1 - PO Box',
  'Organization Name',
  'Organization Title',
  'Organization Department',
  'Birthday',
  'Event 1 - Label',
  'Event 1 - Value',
  'Relation 1 - Label',
  'Relation 1 - Value',
  'Website 1 - Label',
  'Website 1 - Value',
  'Custom Field 1 - Label',
  'Custom Field 1 - Value',
  'Notes',
  'Labels',
];

function formatPhone(whatsapp: string): string {
  return whatsapp.startsWith('+') ? whatsapp : `+${whatsapp}`;
}

// Many names came from Indeed applications typed in ALL CAPS — "ALI HASSAN" becomes "Ali Hassan".
// Capitalizes after spaces, hyphens, and apostrophes, so "anne-marie" and "o'brien" come out right too.
function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/(^|[\s'-])([a-z])/g, (_, sep: string, letter: string) => sep + letter.toUpperCase());
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

  const rows = contacts.map((contact) => {
    const firstName = toTitleCase(contact.firstName);
    const lastName = toTitleCase(contact.lastName);
    const fileAs = `${firstName} ${lastName}`.trim();
    const notes = [contact.location, contact.notes].filter(Boolean).join('\n');
    return [
      '', // Name Prefix
      firstName, // First Name
      '', // Middle Name
      lastName, // Last Name
      '', // Name Suffix
      '', // Phonetic First Name
      '', // Phonetic Middle Name
      '', // Phonetic Last Name
      '', // Nickname
      fileAs, // File As
      contact.email ? 'Home' : '', // E-mail 1 - Label
      contact.email ?? '', // E-mail 1 - Value
      'Mobile', // Phone 1 - Label
      formatPhone(contact.whatsapp), // Phone 1 - Value
      '', // Address 1 - Label
      '', // Address 1 - Country
      '', // Address 1 - Street
      '', // Address 1 - Extended Address
      '', // Address 1 - City
      '', // Address 1 - Region
      '', // Address 1 - Postal Code
      '', // Address 1 - PO Box
      '', // Organization Name
      '', // Organization Title
      '', // Organization Department
      '', // Birthday
      '', // Event 1 - Label
      '', // Event 1 - Value
      '', // Relation 1 - Label
      '', // Relation 1 - Value
      '', // Website 1 - Label
      '', // Website 1 - Value
      '', // Custom Field 1 - Label
      '', // Custom Field 1 - Value
      notes, // Notes
      '', // Labels
    ];
  });

  const csv = toCsv(HEADERS, rows);
  const filename = `contacts-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
