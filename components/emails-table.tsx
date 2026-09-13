'use client';

import { FilterIcon, SearchIcon } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmailPreviewButton } from '@/components/email-preview-button';
import { EmailStatusIcons } from '@/components/email-status-icons';
import { formatRelativeTime } from '@/lib/format-relative-time';
import type { PopulatedEmailSubmission } from '@/lib/types';

type EmailStatusFilter = 'sent' | 'failed';
type EmailTrackingFilter = 'delivered' | 'opened' | 'clicked' | 'bounced';

const STATUS_OPTIONS: { key: EmailStatusFilter; label: string }[] = [
  { key: 'sent', label: 'Sent' },
  { key: 'failed', label: 'Failed' },
];

const TRACKING_OPTIONS: { key: EmailTrackingFilter; label: string; field: keyof PopulatedEmailSubmission }[] = [
  { key: 'delivered', label: 'Delivered', field: 'emailDeliveredAt' },
  { key: 'opened', label: 'Opened', field: 'emailOpenedAt' },
  { key: 'clicked', label: 'Clicked', field: 'emailClickedAt' },
  { key: 'bounced', label: 'Bounced', field: 'emailBouncedAt' },
];

export function EmailsTable({ submissions }: { submissions: PopulatedEmailSubmission[] }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<Set<EmailStatusFilter>>(new Set());
  const [tracking, setTracking] = useState<Set<EmailTrackingFilter>>(new Set());
  const activeFilterCount = status.size + tracking.size;

  function toggleStatus(key: EmailStatusFilter) {
    setStatus((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function toggleTracking(key: EmailTrackingFilter) {
    setTracking((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return submissions.filter((s) => {
      if (query) {
        const haystack = `${s.contact?.firstName ?? ''} ${s.contact?.lastName ?? ''} ${s.contact?.email ?? ''} ${
          s.job?.title ?? ''
        } ${s.emailTemplateId?.label ?? ''}`.toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }
      if (status.size > 0 && !status.has(s.emailStatus as EmailStatusFilter)) {
        return false;
      }
      if (tracking.size > 0 && !TRACKING_OPTIONS.some((t) => tracking.has(t.key) && s[t.field])) {
        return false;
      }
      return true;
    });
  }, [submissions, search, status, tracking]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipient, job, or template…"
            className="pl-8"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
            <FilterIcon className="size-4" />
            Filter
            {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              {STATUS_OPTIONS.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.key}
                  checked={status.has(option.key)}
                  onCheckedChange={() => toggleStatus(option.key)}
                  closeOnClick={false}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Email Tracking</DropdownMenuLabel>
              {TRACKING_OPTIONS.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.key}
                  checked={tracking.has(option.key)}
                  onCheckedChange={() => toggleTracking(option.key)}
                  closeOnClick={false}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
            {activeFilterCount > 0 ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setStatus(new Set());
                    setTracking(new Set());
                  }}
                >
                  Clear filters
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {submissions.length === 0 ? 'No emails sent yet.' : 'No emails match your search/filters.'}
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
                  <TableCell
                    className="hidden text-xs whitespace-nowrap text-muted-foreground sm:table-cell"
                    title={new Date(submission.emailSentAt ?? submission.createdAt).toLocaleString('en-US')}
                    suppressHydrationWarning
                  >
                    {formatRelativeTime(submission.emailSentAt ?? submission.createdAt)}
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
