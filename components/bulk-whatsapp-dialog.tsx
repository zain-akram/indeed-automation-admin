'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WhatsappIcon } from '@/components/whatsapp-icon';
import { createSubmission } from '@/lib/actions/submissions';
import { guessVariableType, humanizeVariableName, isPositionalTemplate } from '@/lib/template-variables';
import type { Contact, Job, TemplateDef, WhatsappAccount } from '@/lib/types';

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

interface BulkWhatsappDialogProps {
  recipients: BulkRecipient[];
  whatsappAccounts: WhatsappAccount[];
  templatesByAccount: Record<string, TemplateDef[]>;
  defaultWhatsappAccountId?: string;
  onDone: () => void;
}

export function BulkWhatsappDialog({
  recipients,
  whatsappAccounts,
  templatesByAccount,
  defaultWhatsappAccountId,
  onDone,
}: BulkWhatsappDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [whatsappAccountId, setWhatsappAccountId] = useState(
    defaultWhatsappAccountId && whatsappAccounts.some((a) => a._id === defaultWhatsappAccountId)
      ? defaultWhatsappAccountId
      : (whatsappAccounts[0]?._id ?? ''),
  );
  const availableTemplates = templatesByAccount[whatsappAccountId] ?? [];
  const [templateKey, setTemplateKey] = useState('');
  const [manualVariables, setManualVariables] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState<BulkResult[] | null>(null);

  const selectedTemplate = availableTemplates.find((t) => t.key === templateKey);
  const isPositional = selectedTemplate ? isPositionalTemplate(selectedTemplate.variables) : false;
  const isTemplateApproved = !selectedTemplate?.status || selectedTemplate.status === 'APPROVED';

  function handleOpenChange(next: boolean) {
    if (sending) return;
    setOpen(next);
    if (next) {
      setResults(null);
      setCurrent(0);
      const account = whatsappAccounts.find((a) => a._id === whatsappAccountId);
      const accountTemplates = templatesByAccount[whatsappAccountId] ?? [];
      const accountDefault = account?.defaultTemplateKey;
      setTemplateKey(accountDefault && accountTemplates.some((t) => t.key === accountDefault) ? accountDefault : '');
      setManualVariables({});
    } else if (results) {
      onDone();
      router.refresh();
    }
  }

  function handleAccountChange(value: string | null) {
    const nextAccountId = value ?? '';
    setWhatsappAccountId(nextAccountId);
    const nextTemplates = templatesByAccount[nextAccountId] ?? [];
    const nextAccount = whatsappAccounts.find((a) => a._id === nextAccountId);
    const nextDefault = nextAccount?.defaultTemplateKey;
    setTemplateKey(nextDefault && nextTemplates.some((t) => t.key === nextDefault) ? nextDefault : '');
    setManualVariables({});
  }

  function resolveVariableValue(contact: Contact, job: Job, name: string): string {
    if (isPositional) {
      return (manualVariables[name] ?? '').trim();
    }
    const type = guessVariableType(name);
    if (type === 'name') return `${contact.firstName} ${contact.lastName}`.trim();
    if (type === 'role') return job.title;
    return (manualVariables[name] ?? '').trim();
  }

  async function handleSend() {
    if (!selectedTemplate || !isTemplateApproved) return;

    setSending(true);
    setResults([]);
    const collected: BulkResult[] = [];

    for (const recipient of recipients) {
      const { contact, job } = recipient;
      const values: Record<string, string> = {};
      let missing: string | null = null;
      for (const name of selectedTemplate.variables) {
        const value = resolveVariableValue(contact, job, name);
        if (!value) {
          missing = humanizeVariableName(name);
          break;
        }
        values[name] = value;
      }

      if (missing) {
        collected.push({ contact, ok: false, error: `Missing "${missing}"` });
      } else {
        try {
          const result = await createSubmission({
            jobId: job._id,
            contactId: contact._id,
            templateKey: selectedTemplate.key,
            whatsappAccountId,
            channel: 'whatsapp',
            variables: values,
            force: true,
          });
          const ok = result.submission?.status === 'sent';
          collected.push({ contact, ok, error: ok ? undefined : (result.submission?.errorMessage ?? result.error) });
        } catch (error) {
          collected.push({ contact, ok: false, error: error instanceof Error ? error.message : 'Failed to send' });
        }
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
        <WhatsappIcon className="size-4" />
        Send WhatsApp ({recipients.length})
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send WhatsApp to {recipients.length} candidates</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {!results ? (
            <>
              <div className="flex flex-col gap-2">
                <Label>WhatsApp Account</Label>
                <Select value={whatsappAccountId} onValueChange={handleAccountChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a WhatsApp account">
                      {() => whatsappAccounts.find((a) => a._id === whatsappAccountId)?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {whatsappAccounts.map((account) => (
                      <SelectItem key={account._id} value={account._id}>
                        {account.label}
                        {account.isActive ? ' (Active)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Template</Label>
                <Select value={templateKey} onValueChange={(value) => setTemplateKey(value ?? '')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a template">{() => selectedTemplate?.label}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableTemplates.map((template) => {
                      const approved = !template.status || template.status === 'APPROVED';
                      return (
                        <SelectItem key={template.key} value={template.key}>
                          {template.label}
                          {approved ? '' : ` — ${template.status}`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {selectedTemplate && !isTemplateApproved ? (
                  <p className="text-xs text-destructive">
                    {`This template is ${selectedTemplate.status?.toLowerCase()} on WhatsApp — it can't be sent yet.`}
                  </p>
                ) : null}
              </div>

              {(selectedTemplate?.variables ?? []).map((name) => {
                const type = guessVariableType(name);
                if (!isPositional && (type === 'name' || type === 'role')) {
                  return null;
                }
                return (
                  <div key={name} className="flex flex-col gap-2">
                    <Label htmlFor={`bulk-wa-${name}`}>
                      {humanizeVariableName(name)} <span className="text-muted-foreground">(applies to all)</span>
                    </Label>
                    <Input
                      id={`bulk-wa-${name}`}
                      value={manualVariables[name] ?? ''}
                      onChange={(e) => setManualVariables((v) => ({ ...v, [name]: e.target.value }))}
                    />
                  </div>
                );
              })}

              <Button
                onClick={handleSend}
                disabled={sending || !selectedTemplate || !isTemplateApproved}
                className="w-fit"
              >
                Send to {recipients.length} candidates
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
