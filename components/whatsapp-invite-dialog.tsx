'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WhatsappIcon } from '@/components/whatsapp-icon';
import { createSubmission } from '@/lib/actions/submissions';
import { renderTemplate } from '@/lib/render-template';
import { guessVariableType, humanizeVariableName, isPositionalTemplate } from '@/lib/template-variables';
import type { Contact, Job, TemplateDef, WhatsappAccount } from '@/lib/types';

interface WhatsappInviteDialogProps {
  job: Job;
  contact: Contact;
  whatsappAccounts: WhatsappAccount[];
  templatesByAccount: Record<string, TemplateDef[]>;
  defaultWhatsappAccountId?: string;
}

export function WhatsappInviteDialog({
  job,
  contact,
  whatsappAccounts,
  templatesByAccount,
  defaultWhatsappAccountId,
}: WhatsappInviteDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [whatsappAccountId, setWhatsappAccountId] = useState(
    defaultWhatsappAccountId && whatsappAccounts.some((a) => a._id === defaultWhatsappAccountId)
      ? defaultWhatsappAccountId
      : (whatsappAccounts[0]?._id ?? ''),
  );
  const availableTemplates = templatesByAccount[whatsappAccountId] ?? [];
  const [templateKey, setTemplateKey] = useState('');
  const [manualVariables, setManualVariables] = useState<Record<string, string>>({});

  const contactName = `${contact.firstName} ${contact.lastName}`.trim();
  const selectedTemplate = availableTemplates.find((t) => t.key === templateKey);
  const isPositional = selectedTemplate ? isPositionalTemplate(selectedTemplate.variables) : false;
  const isTemplateApproved = !selectedTemplate?.status || selectedTemplate.status === 'APPROVED';

  function resolveVariableValue(name: string): string {
    if (isPositional) {
      return (manualVariables[name] ?? '').trim();
    }
    const type = guessVariableType(name);
    if (type === 'name') return contactName;
    if (type === 'role') return job.title;
    return (manualVariables[name] ?? '').trim();
  }

  const previewText = useMemo(() => {
    if (!selectedTemplate) return '';
    const values: Record<string, string> = {};
    for (const name of selectedTemplate.variables) {
      values[name] = resolveVariableValue(name);
    }
    return renderTemplate(selectedTemplate, values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate, isPositional, manualVariables, contactName, job.title]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      const account = whatsappAccounts.find((a) => a._id === whatsappAccountId);
      const accountTemplates = templatesByAccount[whatsappAccountId] ?? [];
      const accountDefault = account?.defaultTemplateKey;
      setTemplateKey(accountDefault && accountTemplates.some((t) => t.key === accountDefault) ? accountDefault : '');
      setManualVariables({});
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

  function handleSend() {
    if (!selectedTemplate) {
      toast.error('Select a template');
      return;
    }
    if (!isTemplateApproved) {
      toast.error(`"${selectedTemplate.label}" isn't approved on WhatsApp yet`);
      return;
    }
    const values: Record<string, string> = {};
    for (const name of selectedTemplate.variables) {
      const value = resolveVariableValue(name);
      if (!value) {
        toast.error(`Fill in "${humanizeVariableName(name)}"`);
        return;
      }
      values[name] = value;
    }

    startTransition(async () => {
      const result = await createSubmission({
        jobId: job._id,
        contactId: contact._id,
        templateKey: selectedTemplate.key,
        whatsappAccountId,
        channel: 'whatsapp',
        variables: values,
        force: true,
      });
      if (result.submission?.status === 'sent') {
        toast.success(`WhatsApp message sent to ${contactName}`);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.submission?.errorMessage ?? result.error ?? 'Message failed to send');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button type="button" variant="ghost" size="icon-sm" title="Invite via WhatsApp" />}>
        <WhatsappIcon className="size-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite {contactName} via WhatsApp</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
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
                <Label htmlFor={`wa-${name}`}>{humanizeVariableName(name)}</Label>
                <Input
                  id={`wa-${name}`}
                  value={manualVariables[name] ?? ''}
                  onChange={(e) => setManualVariables((v) => ({ ...v, [name]: e.target.value }))}
                />
              </div>
            );
          })}

          {selectedTemplate ? (
            <div className="flex flex-col gap-2">
              <Label>Preview</Label>
              <div className="rounded-none bg-muted/20 p-3 text-sm whitespace-pre-wrap ring-1 ring-foreground/10">
                {previewText}
              </div>
            </div>
          ) : null}

          <Button onClick={handleSend} disabled={pending || !selectedTemplate || !isTemplateApproved} className="w-fit">
            {pending ? 'Sending…' : 'Send WhatsApp Message'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
