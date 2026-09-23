'use client';

import { FilterIcon, SearchIcon } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';
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
import {
  getEmailSubmissionsPage,
  type EmailStatusFilter,
  type EmailTrackingFilter,
  type GenderFilter,
} from '@/lib/actions/submissions';
import { formatRelativeTime } from '@/lib/format-relative-time';
import type { PopulatedEmailSubmission } from '@/lib/types';

const STATUS_OPTIONS: { key: EmailStatusFilter; label: string }[] = [
  { key: 'sent', label: 'Sent' },
  { key: 'failed', label: 'Failed' },
];

const TRACKING_OPTIONS: { key: EmailTrackingFilter; label: string }[] = [
  { key: 'delivered', label: 'Delivered' },
  { key: 'opened', label: 'Opened' },
  { key: 'clicked', label: 'Clicked' },
  { key: 'bounced', label: 'Bounced' },
];

const GENDER_OPTIONS: { key: GenderFilter; label: string }[] = [
  { key: 'male', label: 'Male' },
  { key: 'female', label: 'Female' },
  { key: 'unknown', label: 'Unknown' },
  { key: 'unclassified', label: 'Unclassified' },
];

interface EmailsTableProps {
  initialItems: PopulatedEmailSubmission[];
  initialTotal: number;
  pageSize: number;
}

export function EmailsTable({ initialItems, initialTotal, pageSize }: EmailsTableProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<Set<EmailStatusFilter>>(new Set());
  const [tracking, setTracking] = useState<Set<EmailTrackingFilter>>(new Set());
  const [gender, setGender] = useState<Set<GenderFilter>>(new Set());
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [searching, startSearch] = useTransition();
  const [loadingMore, startLoadMore] = useTransition();
  const skippedFirstRun = useRef(false);
  const statusKey = Array.from(status).sort().join(',');
  const trackingKey = Array.from(tracking).sort().join(',');
  const genderKey = Array.from(gender).sort().join(',');
  const activeFilterCount = status.size + tracking.size + gender.size;

  useEffect(() => {
    if (!skippedFirstRun.current) {
      skippedFirstRun.current = true;
      return;
    }
    const handle = setTimeout(() => {
      startSearch(async () => {
        const result = await getEmailSubmissionsPage({
          search: search || undefined,
          status: status.size ? Array.from(status) : undefined,
          tracking: tracking.size ? Array.from(tracking) : undefined,
          gender: gender.size ? Array.from(gender) : undefined,
          limit: pageSize,
        });
        setItems(result.items);
        setTotal(result.total);
      });
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusKey, trackingKey, genderKey]);

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

  function toggleGender(key: GenderFilter) {
    setGender((prev) => {
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
      const result = await getEmailSubmissionsPage({
        search: search || undefined,
        status: status.size ? Array.from(status) : undefined,
        tracking: tracking.size ? Array.from(tracking) : undefined,
        gender: gender.size ? Array.from(gender) : undefined,
        limit: pageSize,
        skip: items.length,
      });
      setItems((prev) => [...prev, ...result.items]);
    });
  }

  const hasMore = items.length < total;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
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
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Gender</DropdownMenuLabel>
              {GENDER_OPTIONS.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.key}
                  checked={gender.has(option.key)}
                  onCheckedChange={() => toggleGender(option.key)}
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
                    setGender(new Set());
                  }}
                >
                  Clear filters
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {search || activeFilterCount > 0 ? 'No emails match your search/filters.' : 'No emails sent yet.'}
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
            <TableBody className={searching ? 'opacity-50 transition-opacity' : undefined}>
              {items.map((submission) => (
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
