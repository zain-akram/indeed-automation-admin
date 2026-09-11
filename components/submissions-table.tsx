'use client';

import { FilterIcon, SearchIcon } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BulkEmailDialog } from '@/components/bulk-email-dialog';
import { BulkWhatsappDialog } from '@/components/bulk-whatsapp-dialog';
import { CandidateStatus } from '@/components/candidate-status';
import { EmailInviteDialog } from '@/components/email-invite-dialog';
import { EmailTrackingIcons } from '@/components/email-status-icons';
import { IndeedIcon } from '@/components/indeed-icon';
import { SubmissionRowActions } from '@/components/submission-row-actions';
import { WhatsappInviteDialog } from '@/components/whatsapp-invite-dialog';
import { getSubmissionsPage, type CandidateStatusFilter, type EmailTrackingFilter } from '@/lib/actions/submissions';
import { formatRelativeTime } from '@/lib/format-relative-time';
import { getIndeedCandidateUrl } from '@/lib/indeed';
import type { EmailTemplate, PopulatedSubmission, TemplateDef, WhatsappAccount } from '@/lib/types';

const TRACKING_OPTIONS: { key: EmailTrackingFilter; label: string }[] = [
  { key: 'delivered', label: 'Delivered' },
  { key: 'opened', label: 'Opened' },
  { key: 'clicked', label: 'Clicked' },
  { key: 'bounced', label: 'Bounced' },
];

const STATUS_OPTIONS: { key: CandidateStatusFilter; label: string }[] = [
  { key: 'not_contacted', label: 'Not Contacted' },
  { key: 'whatsapp_sent', label: 'WhatsApp Sent' },
  { key: 'whatsapp_failed', label: 'WhatsApp Failed' },
  { key: 'email_sent', label: 'Email Sent' },
  { key: 'email_failed', label: 'Email Failed' },
];

interface SubmissionsTableProps {
  jobId?: string;
  initialItems: PopulatedSubmission[];
  initialTotal: number;
  pageSize: number;
  whatsappAccounts: WhatsappAccount[];
  defaultWhatsappAccountId?: string;
  emailTemplates: EmailTemplate[];
  templatesByAccount: Record<string, TemplateDef[]>;
}

export function SubmissionsTable({
  jobId,
  initialItems,
  initialTotal,
  pageSize,
  whatsappAccounts,
  defaultWhatsappAccountId,
  emailTemplates,
  templatesByAccount,
}: SubmissionsTableProps) {
  const showJobColumn = !jobId;
  const columnCount = showJobColumn ? 9 : 8;
  const [search, setSearch] = useState('');
  const [tracking, setTracking] = useState<Set<EmailTrackingFilter>>(new Set());
  const [status, setStatus] = useState<Set<CandidateStatusFilter>>(new Set());
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [searching, startSearch] = useTransition();
  const [loadingMore, startLoadMore] = useTransition();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const skippedFirstRun = useRef(false);
  const trackingKey = Array.from(tracking).sort().join(',');
  const statusKey = Array.from(status).sort().join(',');
  const activeFilterCount = tracking.size + status.size;

  useEffect(() => {
    if (!skippedFirstRun.current) {
      skippedFirstRun.current = true;
      return;
    }
    const handle = setTimeout(() => {
      startSearch(async () => {
        const result = await getSubmissionsPage({
          jobId,
          search: search || undefined,
          tracking: tracking.size ? Array.from(tracking) : undefined,
          status: status.size ? Array.from(status) : undefined,
          limit: pageSize,
        });
        setItems(result.items);
        setTotal(result.total);
        setSelectedIds(new Set());
      });
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, trackingKey, statusKey]);

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

  function toggleStatus(key: CandidateStatusFilter) {
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

  function handleLoadMore() {
    startLoadMore(async () => {
      const result = await getSubmissionsPage({
        jobId,
        search: search || undefined,
        tracking: tracking.size ? Array.from(tracking) : undefined,
        status: status.size ? Array.from(status) : undefined,
        limit: pageSize,
        skip: items.length,
      });
      setItems((prev) => [...prev, ...result.items]);
    });
  }

  const hasMore = items.length < total;
  const selectableItems = useMemo(() => items.filter((s) => s.contact && s.job), [items]);
  const allSelected = selectableItems.length > 0 && selectedIds.size === selectableItems.length;
  const someSelected = selectedIds.size > 0 && !allSelected;
  const selectedRecipients = useMemo(
    () =>
      items
        .filter((s) => selectedIds.has(s._id) && s.contact && s.job)
        .map((s) => ({ submissionId: s._id, contact: s.contact!, job: s.job! })),
    [items, selectedIds],
  );

  function toggleSelectAll() {
    setSelectedIds(allSelected ? new Set() : new Set(selectableItems.map((s) => s._id)));
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative max-w-sm flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, or email…"
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
                      setTracking(new Set());
                      setStatus(new Set());
                    }}
                  >
                    Clear filters
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {selectedIds.size > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{selectedIds.size} selected</span>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
              Clear
            </Button>
            <BulkWhatsappDialog
              recipients={selectedRecipients}
              whatsappAccounts={whatsappAccounts}
              templatesByAccount={templatesByAccount}
              defaultWhatsappAccountId={defaultWhatsappAccountId}
              onDone={() => setSelectedIds(new Set())}
            />
            <BulkEmailDialog
              recipients={selectedRecipients}
              emailTemplates={emailTemplates}
              onDone={() => setSelectedIds(new Set())}
            />
          </div>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {search || activeFilterCount > 0 ? 'No submissions match your search/filters.' : 'No submissions yet.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-none ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onCheckedChange={toggleSelectAll}
                    disabled={selectableItems.length === 0}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Person</TableHead>
                {showJobColumn ? <TableHead>Job</TableHead> : null}
                <TableHead className="hidden md:table-cell">WhatsApp</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Email Tracking</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={searching ? 'opacity-50 transition-opacity' : undefined}>
              {items.map((submission) => {
                const indeedCandidateUrl = getIndeedCandidateUrl(submission.resumeUrl);
                return (
                  <TableRow key={submission._id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(submission._id)}
                        onCheckedChange={() => toggleSelect(submission._id)}
                        disabled={!submission.contact || !submission.job}
                        aria-label={`Select ${submission.contact ? `${submission.contact.firstName} ${submission.contact.lastName}` : 'row'}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {submission.contact ? (
                        <Link href={`/contacts/${submission.contact._id}`} className="hover:underline">
                          {submission.contact.firstName} {submission.contact.lastName}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground italic">Deleted contact</span>
                      )}
                    </TableCell>
                    {showJobColumn ? (
                      <TableCell>
                        {submission.job ? (
                          <Link href={`/jobs/${submission.job._id}`} className="hover:underline">
                            {submission.job.title}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground italic">Deleted job</span>
                        )}
                      </TableCell>
                    ) : null}
                    <TableCell className="hidden md:table-cell">{submission.contact?.whatsapp ?? '—'}</TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {submission.contact?.email ?? '—'}
                    </TableCell>
                    <TableCell>
                      <CandidateStatus submission={submission} showTemplate />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <EmailTrackingIcons submission={submission} />
                    </TableCell>
                    <TableCell
                      className="hidden text-xs whitespace-nowrap text-muted-foreground sm:table-cell"
                      title={new Date(submission.appliedAt ?? submission.createdAt).toLocaleString('en-US')}
                      suppressHydrationWarning
                    >
                      {formatRelativeTime(submission.appliedAt ?? submission.createdAt)}
                    </TableCell>
                    <TableCell className="flex flex-wrap justify-end gap-1 text-right">
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
                      ) : null}
                      {submission.contact && submission.job ? (
                        <>
                          <WhatsappInviteDialog
                            job={submission.job}
                            contact={submission.contact}
                            whatsappAccounts={whatsappAccounts}
                            templatesByAccount={templatesByAccount}
                            defaultWhatsappAccountId={defaultWhatsappAccountId}
                          />
                          <EmailInviteDialog
                            job={submission.job}
                            contact={submission.contact}
                            emailTemplates={emailTemplates}
                            whatsappAccounts={whatsappAccounts}
                          />
                        </>
                      ) : null}
                      <SubmissionRowActions
                        submissionId={submission._id}
                        message={submission.renderedMessage}
                        title={`Message to ${submission.contact ? `${submission.contact.firstName} ${submission.contact.lastName}` : 'deleted contact'}`}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
              {hasMore ? (
                <TableRow>
                  <TableCell colSpan={columnCount} className="text-center">
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
