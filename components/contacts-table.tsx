'use client';

import { EyeIcon, MoreHorizontalIcon, PencilIcon, SearchIcon, SparklesIcon } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { IndeedIcon } from '@/components/indeed-icon';
import {
  classifyGenderBatchAction,
  getContactsPage,
  getGenderStats,
  type ContactPageRow,
  type GenderFilterValue,
  type GenderStats,
} from '@/lib/actions/contacts';
import { getIndeedCandidateUrl } from '@/lib/indeed';

interface ContactsTableProps {
  initialItems: ContactPageRow[];
  initialTotal: number;
  initialGenderStats: GenderStats;
  pageSize: number;
}

const GENDER_LABELS: Record<'male' | 'female' | 'unknown', string> = {
  male: 'Male',
  female: 'Female',
  unknown: 'Unknown',
};

const GENDER_FILTER_OPTIONS: { value: GenderFilterValue | 'all'; label: string }[] = [
  { value: 'all', label: 'All Genders' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'unknown', label: 'Unknown' },
  { value: 'unclassified', label: 'Unclassified' },
];

const CLASSIFY_BATCH_SIZE = 100;

export function ContactsTable({ initialItems, initialTotal, initialGenderStats, pageSize }: ContactsTableProps) {
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState<GenderFilterValue | 'all'>('all');
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [genderStats, setGenderStats] = useState(initialGenderStats);
  const [classifying, setClassifying] = useState(false);
  const [searching, startSearch] = useTransition();
  const [loadingMore, startLoadMore] = useTransition();
  const skippedFirstRun = useRef(false);

  function genderParam(): GenderFilterValue[] | undefined {
    return gender === 'all' ? undefined : [gender];
  }

  useEffect(() => {
    if (!skippedFirstRun.current) {
      skippedFirstRun.current = true;
      return;
    }
    const handle = setTimeout(() => {
      startSearch(async () => {
        const result = await getContactsPage({ search: search || undefined, gender: genderParam(), limit: pageSize });
        setItems(result.items);
        setTotal(result.total);
      });
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, gender]);

  function handleLoadMore() {
    startLoadMore(async () => {
      const result = await getContactsPage({
        search: search || undefined,
        gender: genderParam(),
        limit: pageSize,
        skip: items.length,
      });
      setItems((prev) => [...prev, ...result.items]);
    });
  }

  async function handleClassify() {
    setClassifying(true);
    try {
      let remaining = genderStats.unclassified;
      let processedTotal = 0;
      while (remaining > 0) {
        const result = await classifyGenderBatchAction(CLASSIFY_BATCH_SIZE);
        processedTotal += result.processed;
        remaining = result.remaining;
        if (result.processed === 0) {
          break;
        }
      }
      setGenderStats(await getGenderStats());
      if (processedTotal > 0) {
        toast.success(`Classified ${processedTotal} contact${processedTotal === 1 ? '' : 's'}`);
        const result = await getContactsPage({
          search: search || undefined,
          gender: genderParam(),
          limit: Math.max(items.length, pageSize),
        });
        setItems(result.items);
        setTotal(result.total);
      } else {
        toast.info('No unclassified contacts to process');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to classify contacts');
    } finally {
      setClassifying(false);
    }
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
            placeholder="Search name, number, email, or notes…"
            className="pl-8"
          />
        </div>
        <Select value={gender} onValueChange={(value) => setGender((value as GenderFilterValue | 'all') ?? 'all')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Genders" />
          </SelectTrigger>
          <SelectContent>
            {GENDER_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClassify}
          disabled={classifying || genderStats.unclassified === 0}
        >
          <SparklesIcon className="size-4" />
          {classifying
            ? 'Classifying…'
            : genderStats.unclassified > 0
              ? `Classify Gender (AI) · ${genderStats.unclassified} left`
              : 'Classify Gender (AI)'}
        </Button>
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
                <TableHead>Gender</TableHead>
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
                    <TableCell className="text-muted-foreground">
                      {contact.gender ? GENDER_LABELS[contact.gender] : '—'}
                    </TableCell>
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
                  <TableCell colSpan={7} className="text-center">
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
