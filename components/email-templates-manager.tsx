'use client';

import { MoreHorizontalIcon, PencilIcon, SearchIcon, StarIcon, Trash2Icon } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { deleteEmailTemplateAction, setDefaultEmailTemplateAction } from '@/lib/actions/email-templates';
import type { EmailTemplate, EmailTemplateStats } from '@/lib/types';

const EMPTY_STATS: EmailTemplateStats = { sent: 0, delivered: 0, opened: 0, clicked: 0, failed: 0 };

function EmailTemplateRow({ template, stats }: { template: EmailTemplate; stats: EmailTemplateStats }) {
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);

  function handleSetDefault() {
    startTransition(async () => {
      await setDefaultEmailTemplateAction(template._id);
      toast.success(`"${template.label}" is now the default email template`);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteEmailTemplateAction(template._id);
        toast.success('Template deleted');
      } catch {
        toast.error('Failed to delete template');
      }
    });
  }

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <Link href={`/email-templates/${template._id}`} className="hover:underline">
            {template.label}
          </Link>
          {template.isDefault ? <Badge>Default</Badge> : null}
        </div>
      </TableCell>
      <TableCell className="hidden max-w-xs truncate text-muted-foreground md:table-cell">
        {template.description}
      </TableCell>
      <TableCell className="hidden max-w-xs truncate text-muted-foreground lg:table-cell">{template.subject}</TableCell>
      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
        {stats.sent} sent · {stats.delivered} delivered · {stats.opened} opened
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />} disabled={pending}>
            <MoreHorizontalIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem render={<Link href={`/email-templates/${template._id}`} />}>
              <PencilIcon />
              Edit
            </DropdownMenuItem>
            {!template.isDefault ? (
              <DropdownMenuItem onClick={handleSetDefault}>
                <StarIcon />
                Set Default
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2Icon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete &quot;{template.label}&quot;?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes the template permanently. If it&apos;s the default, another one will be made default
                automatically if any remain.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction disabled={pending} onClick={handleDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
}

interface EmailTemplatesManagerProps {
  templates: EmailTemplate[];
  stats: Record<string, EmailTemplateStats>;
}

export function EmailTemplatesManager({ templates, stats }: EmailTemplatesManagerProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const sorted = [...templates].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
    if (!query) {
      return sorted;
    }
    return sorted.filter((t) => `${t.label} ${t.description ?? ''} ${t.subject}`.toLowerCase().includes(query));
  }, [templates, search]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search label, description, or subject…"
          className="pl-8"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {templates.length === 0 ? 'No email templates yet.' : 'No templates match your search.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-none ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead className="hidden lg:table-cell">Subject</TableHead>
                <TableHead>Emails</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((template) => (
                <EmailTemplateRow key={template._id} template={template} stats={stats[template._id] ?? EMPTY_STATS} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
