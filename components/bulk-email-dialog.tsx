'use client';

import { MailIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createSubmission } from '@/lib/actions/submissions';
import type { Contact, EmailTemplate, Job } from '@/lib/types';

interface BulkRecipient {
  submissionId: string;
  contact: Contact;
  job: Job;
}

interface BulkResult {
  contact: Contact;
  ok: boolean;
  error?: string;
}

interface BulkEmailDialogProps {
  recipients: BulkRecipient[];
  emailTemplates: EmailTemplate[];
  onDone: () => void;
}

export function BulkEmailDialog({ recipients, emailTemplates, onDone }: BulkEmailDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [emailTemplateId, setEmailTemplateId] = useState(
    () => emailTemplates.find((t) => t.isDefault)?._id ?? emailTemplates[0]?._id ?? '',
  );
  const [sending, setSending] = useState(false);
  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState<BulkResult[] | null>(null);

  const selectedTemplate = emailTemplates.find((t) => t._id === emailTemplateId);
  const withEmail = recipients.filter((r) => r.contact.email);
  const withoutEmail = recipients.length - withEmail.length;

  function handleOpenChange(next: boolean) {
    if (sending) return;
    setOpen(next);
    if (next) {
      setResults(null);
      setCurrent(0);
    } else if (results) {
      onDone();
      router.refresh();
    }
  }

  async function handleSend() {
    if (!emailTemplateId) return;

    setSending(true);
    setResults([]);
    const collected: BulkResult[] = [];

    for (const recipient of recipients) {
      const { contact, job } = recipient;
      if (!contact.email) {
        collected.push({ contact, ok: false, error: 'No email address on file' });
        setResults([...collected]);
        setCurrent(collected.length);
        continue;
      }
      try {
        const result = await createSubmission({
          jobId: job._id,
          contactId: contact._id,
          channel: 'email',
          emailTemplateId,
          force: true,
        });
        const ok = result.submission?.emailStatus === 'sent';
        collected.push({ contact, ok, error: ok ? undefined : (result.submission?.emailError ?? result.error) });
      } catch (error) {
        collected.push({ contact, ok: false, error: error instanceof Error ? error.message : 'Failed to send' });
      }
      setResults([...collected]);
      setCurrent(collected.length);
    }

    setSending(false);
  }

  const successCount = results?.filter((r) => r.ok).length ?? 0;
  const failCount = results ? results.length - successCount : 0;
  const isDone = results !== null && !sending && results.length === recipients.length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button type="button" variant="outline" />}>
        <MailIcon className="size-4" />
        Send Email ({recipients.length})
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Email to {recipients.length} candidates</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {!results ? (
            <>
              {emailTemplates.length === 0 ? (
                <p className="text-xs text-destructive">
                  No email templates yet — create one in Email Templates before sending.
                </p>
              ) : (
                <Select value={emailTemplateId} onValueChange={(value) => setEmailTemplateId((value as string) ?? '')}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{() => selectedTemplate?.label}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {emailTemplates.map((template) => (
                      <SelectItem key={template._id} value={template._id}>
                        {template.label}
                        {template.isDefault ? ' (Default)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {withoutEmail > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {withoutEmail} of {recipients.length} selected candidates have no email on file and will be skipped.
                </p>
              ) : null}

              <Button onClick={handleSend} disabled={sending || !emailTemplateId} className="w-fit">
                Send to {withEmail.length} candidates
              </Button>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <div className="h-2 w-full overflow-hidden rounded-none bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(current / recipients.length) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {isDone
                    ? `Done — ${successCount} sent, ${failCount} failed`
                    : `Sending ${current} of ${recipients.length}…`}
                </p>
              </div>
              {failCount > 0 ? (
                <ul className="max-h-48 list-disc overflow-y-auto pl-5 text-sm text-muted-foreground">
                  {results
                    .filter((r) => !r.ok)
                    .map((r) => (
                      <li key={r.contact._id}>
                        {r.contact.firstName} {r.contact.lastName}: {r.error ?? 'Failed'}
                      </li>
                    ))}
                </ul>
              ) : null}
              {isDone ? (
                <Button onClick={() => handleOpenChange(false)} className="w-fit">
                  Close
                </Button>
              ) : null}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
