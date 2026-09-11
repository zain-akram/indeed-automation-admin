'use client';

import { EyeIcon, MoreHorizontalIcon, PencilIcon, SearchIcon } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { IndeedIcon } from '@/components/indeed-icon';
import { getContactsPage, type ContactPageRow } from '@/lib/actions/contacts';
import { getIndeedCandidateUrl } from '@/lib/indeed';

interface ContactsTableProps {
  initialItems: ContactPageRow[];
  initialTotal: number;
  pageSize: number;
}

export function ContactsTable({ initialItems, initialTotal, pageSize }: ContactsTableProps) {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [searching, startSearch] = useTransition();
  const [loadingMore, startLoadMore] = useTransition();
  const skippedFirstRun = useRef(false);

  useEffect(() => {
    if (!skippedFirstRun.current) {
      skippedFirstRun.current = true;
      return;
    }
    const handle = setTimeout(() => {
      startSearch(async () => {
        const result = await getContactsPage({ search: search || undefined, limit: pageSize });
        setItems(result.items);
        setTotal(result.total);
      });
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function handleLoadMore() {
    startLoadMore(async () => {
      const result = await getContactsPage({ search: search || undefined, limit: pageSize, skip: items.length });
      setItems((prev) => [...prev, ...result.items]);
    });
  }

  const hasMore = items.length < total;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, number, email, or notes…"
          className="pl-8"
        />
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No contacts match your search.</p>
      ) : (
        <div className="overflow-x-auto rounded-none ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Total Submissions</TableHead>
                <TableHead>Indeed</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={searching ? 'opacity-50 transition-opacity' : undefined}>
              {items.map((contact) => {
                const indeedCandidateUrl = getIndeedCandidateUrl(contact.resumeUrl);
                return (
                  <TableRow key={contact._id}>
                    <TableCell className="font-medium">
                      <Link href={`/contacts/${contact._id}`} className="hover:underline">
                        {contact.firstName} {contact.lastName}
                      </Link>
                    </TableCell>
                    <TableCell>{contact.whatsapp}</TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{contact.email ?? '—'}</TableCell>
                    <TableCell>{contact.interviewCount}</TableCell>
                    <TableCell>
                      {indeedCandidateUrl ? (
                        <Button
                          render={<a href={indeedCandidateUrl} target="_blank" rel="noopener noreferrer" />}
                          nativeButton={false}
                          variant="ghost"
                          size="icon-sm"
                          title="View on Indeed"
                        >
                          <IndeedIcon className="size-4" />
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                          <MoreHorizontalIcon className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem render={<Link href={`/contacts/${contact._id}`} />}>
                            <EyeIcon />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem render={<Link href={`/contacts/${contact._id}/edit`} />}>
                            <PencilIcon />
                            Edit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {hasMore ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    <Button variant="outline" size="sm" onClick={handleLoadMore} disabled={loadingMore}>
                      {loadingMore ? 'Loading…' : `Load More (${total - items.length} remaining)`}
                    </Button>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
