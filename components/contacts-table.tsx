'use client';

import { SearchIcon } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Contact } from '@/lib/types';

interface ContactRow extends Contact {
  interviewCount: number;
}

export function ContactsTable({ contacts }: { contacts: ContactRow[] }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return contacts;
    }
    return contacts.filter((c) =>
      `${c.firstName} ${c.lastName} ${c.whatsapp} ${c.notes ?? ''}`.toLowerCase().includes(query),
    );
  }, [contacts, search]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, number, or notes…"
          className="pl-8"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No contacts match your search.</p>
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
              {filtered.map((contact) => (
                <TableRow key={contact._id}>
                  <TableCell className="font-medium">
                    <Link href={`/contacts/${contact._id}`} className="hover:underline">
                      {contact.firstName} {contact.lastName}
                    </Link>
                  </TableCell>
                  <TableCell>{contact.whatsapp}</TableCell>
                  <TableCell className="hidden max-w-xs truncate sm:table-cell">{contact.notes}</TableCell>
                  <TableCell>{contact.interviewCount}</TableCell>
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
