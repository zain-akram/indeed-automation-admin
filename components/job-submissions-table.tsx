'use client';

import { SearchIcon } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CandidateStatus } from '@/components/candidate-status';
import { EmailInviteDialog } from '@/components/email-invite-dialog';
import { EmailTrackingIcons } from '@/components/email-status-icons';
import { IndeedIcon } from '@/components/indeed-icon';
import { SubmissionRowActions } from '@/components/submission-row-actions';
import { WhatsappInviteDialog } from '@/components/whatsapp-invite-dialog';
import { getSubmissionsPage } from '@/lib/actions/submissions';
import { formatRelativeTime } from '@/lib/format-relative-time';
import { getIndeedCandidateUrl } from '@/lib/indeed';
import type { EmailTemplate, Job, PopulatedSubmission, TemplateDef, WhatsappAccount } from '@/lib/types';

interface JobSubmissionsTableProps {
  jobId: string;
  job: Job;
  initialItems: PopulatedSubmission[];
  initialTotal: number;
  pageSize: number;
  whatsappAccounts: WhatsappAccount[];
  defaultWhatsappAccountId?: string;
  emailTemplates: EmailTemplate[];
  templatesByAccount: Record<string, TemplateDef[]>;
}

export function JobSubmissionsTable({
  jobId,
  job,
  initialItems,
  initialTotal,
  pageSize,
  whatsappAccounts,
  defaultWhatsappAccountId,
  emailTemplates,
  templatesByAccount,
}: JobSubmissionsTableProps) {
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
        const result = await getSubmissionsPage({ jobId, search: search || undefined, limit: pageSize });
        setItems(result.items);
        setTotal(result.total);
      });
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function handleLoadMore() {
    startLoadMore(async () => {
      const result = await getSubmissionsPage({
        jobId,
        search: search || undefined,
        limit: pageSize,
        skip: items.length,
      });
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
          placeholder="Search name, phone, or email…"
          className="pl-8"
        />
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {search ? 'No submissions match your search.' : 'No submissions for this job yet.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-none ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Person</TableHead>
                <TableHead className="hidden md:table-cell">WhatsApp</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Email Tracking</TableHead>
                <TableHead className="hidden lg:table-cell">Milestone</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={searching ? 'opacity-50 transition-opacity' : undefined}>
              {items.map((submission) => {
                const indeedCandidateUrl = getIndeedCandidateUrl(submission.resumeUrl);
                return (
                  <TableRow key={submission._id}>
                    <TableCell className="font-medium">
                      {submission.contact ? (
                        <Link href={`/contacts/${submission.contact._id}`} className="hover:underline">
                          {submission.contact.firstName} {submission.contact.lastName}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground italic">Deleted contact</span>
                      )}
                    </TableCell>
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
                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                      {submission.milestone ?? '—'}
                    </TableCell>
                    <TableCell
                      className="hidden text-xs whitespace-nowrap text-muted-foreground sm:table-cell"
                      title={new Date(submission.appliedAt ?? submission.createdAt).toLocaleString('en-US')}
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
                      {submission.contact ? (
                        <>
                          <WhatsappInviteDialog
                            job={job}
                            contact={submission.contact}
                            whatsappAccounts={whatsappAccounts}
                            templatesByAccount={templatesByAccount}
                            defaultWhatsappAccountId={defaultWhatsappAccountId}
                          />
                          <EmailInviteDialog
                            job={job}
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
            </TableBody>
          </Table>
        </div>
      )}

      {hasMore ? (
        <Button variant="outline" onClick={handleLoadMore} disabled={loadingMore} className="w-fit">
          {loadingMore ? 'Loading…' : `Load More (${total - items.length} remaining)`}
        </Button>
      ) : null}
    </div>
  );
}
