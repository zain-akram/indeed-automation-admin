'use client';

import { UploadCloudIcon } from 'lucide-react';
import { useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { importIndeedRows, type ImportIndeedRow, type ImportSummary } from '@/lib/actions/import';
import { parseCsv } from '@/lib/csv';
import { cn } from '@/lib/utils';

function toImportRow(record: Record<string, string>): ImportIndeedRow | null {
  if (!record.name?.trim() || !record.phone?.trim() || !record.job_title?.trim()) {
    return null;
  }
  return {
    candidate_id: record.candidate_id || undefined,
    name: record.name.trim(),
    email: record.email || undefined,
    phone: record.phone.trim(),
    location: record.location || undefined,
    job_id: record.job_id || undefined,
    job_title: record.job_title.trim(),
    applied_at: record.applied_at || undefined,
    interest_level: record.interest_level || undefined,
    milestone: record.milestone || undefined,
    resume_url: record.resume_url || undefined,
    submission_uuid: record.submission_uuid || undefined,
  };
}

export function IndeedImportDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [dragActive, setDragActive] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setSummary(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const records = parseCsv(text);
      const rows = records.map(toImportRow).filter((r): r is ImportIndeedRow => r !== null);
      if (rows.length === 0) {
        toast.error('No valid rows found — check the file has name, phone, and job_title columns.');
        return;
      }
      startTransition(async () => {
        const result = await importIndeedRows(rows);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        setSummary(result.summary ?? null);
        toast.success(`Imported ${rows.length} row${rows.length === 1 ? '' : 's'}`);
      });
    };
    reader.onerror = () => toast.error('Could not read the file');
    reader.readAsText(file);
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setSummary(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button type="button" variant="outline" />}>
        <UploadCloudIcon className="size-4" />
        Import from Indeed
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import from Indeed</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">
            Upload the candidates CSV export. Jobs and contacts are matched and updated, not duplicated — safe to
            re-upload the same file.
          </p>

          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-none border border-dashed p-6 text-center text-sm text-muted-foreground transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring/50',
              dragActive ? 'border-primary bg-primary/5' : 'border-border',
            )}
          >
            <UploadCloudIcon className="size-6" />
            <span>{pending ? 'Importing…' : 'Drag & drop, or click to upload a CSV file'}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {summary ? (
            <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
              <div>
                <p className="text-muted-foreground">Jobs</p>
                <p className="font-medium text-foreground">
                  {summary.jobsCreated} new · {summary.jobsMatched} matched
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Contacts</p>
                <p className="font-medium text-foreground">
                  {summary.contactsCreated} new · {summary.contactsMatched} matched
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Applications</p>
                <p className="font-medium text-foreground">
                  {summary.submissionsCreated} new · {summary.submissionsUpdated} updated
                </p>
              </div>
              {summary.errors.length > 0 ? (
                <div className="col-span-full flex flex-col gap-1">
                  <p className="text-destructive">
                    {summary.errors.length} row{summary.errors.length === 1 ? '' : 's'} failed
                  </p>
                  <ul className="list-disc pl-5 text-muted-foreground">
                    {summary.errors.slice(0, 5).map((e) => (
                      <li key={e.row}>
                        Row {e.row + 1}: {e.message}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
