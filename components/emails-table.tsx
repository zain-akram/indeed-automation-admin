'use client';

import { format } from 'date-fns';
import { SearchIcon } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmailPreviewButton } from '@/components/email-preview-button';
import { EmailStatusIcons } from '@/components/email-status-icons';
import type { PopulatedEmailSubmission } from '@/lib/types';

export function EmailsTable({ submissions }: { submissions: PopulatedEmailSubmission[] }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return submissions;
    }
    return submissions.filter((s) =>
      `${s.contact?.firstName ?? ''} ${s.contact?.lastName ?? ''} ${s.contact?.email ?? ''} ${s.job?.title ?? ''} ${
        s.emailTemplateId?.label ?? ''
      }`
        .toLowerCase()
        .includes(query),
    );
  }, [submissions, search]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search recipient, job, or template…"
          className="pl-8"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {submissions.length === 0 ? 'No emails sent yet.' : 'No emails match your search.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-none ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>To</TableHead>
                <TableHead className="hidden md:table-cell">Job</TableHead>
                <TableHead className="hidden lg:table-cell">Template</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Sent</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((submission) => (
                <TableRow key={submission._id}>
                  <TableCell className="font-medium">
                    {submission.contact ? (
                      <Link href={`/contacts/${submission.contact._id}`} className="flex flex-col hover:underline">
                        <span>
                          {submission.contact.firstName} {submission.contact.lastName}
                        </span>
                        <span className="text-xs text-muted-foreground">{submission.contact.email}</span>
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">Deleted contact</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {submission.job?.title ?? <span className="text-muted-foreground">Deleted job</span>}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {submission.emailTemplateId?.label ?? '—'}
                  </TableCell>
                  <TableCell>
                    <EmailStatusIcons submission={submission} />
                  </TableCell>
                  <TableCell className="hidden text-xs whitespace-nowrap text-muted-foreground sm:table-cell">
                    {format(new Date(submission.emailSentAt ?? submission.createdAt), 'MMM d, yyyy h:mm a')}
                  </TableCell>
                  <TableCell className="text-right">
                    {submission.emailTemplateId ? (
                      <EmailPreviewButton
                        template={submission.emailTemplateId}
                        contact={submission.contact}
                        job={submission.job}
                      />
                    ) : null}
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
