'use client';

import { MailIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createSubmission } from '@/lib/actions/submissions';
import { resolvePlaceholders, withLinkedWhatsappNumber } from '@/lib/email-placeholders';
import type { Contact, EmailTemplate, Job, WhatsappAccount } from '@/lib/types';

interface EmailInviteDialogProps {
  job: Job;
  contact: Contact;
  emailTemplates: EmailTemplate[];
  whatsappAccounts: WhatsappAccount[];
}

export function EmailInviteDialog({ job, contact, emailTemplates, whatsappAccounts }: EmailInviteDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [emailTemplateId, setEmailTemplateId] = useState(
    () => emailTemplates.find((t) => t.isDefault)?._id ?? emailTemplates[0]?._id ?? '',
  );

  const contactName = `${contact.firstName} ${contact.lastName}`.trim();
  const selectedTemplate = emailTemplates.find((t) => t._id === emailTemplateId);
  const activeWhatsappAccount = whatsappAccounts.find((a) => a.isActive);

  const previewValues: Record<string, string> = {
    'contact.name': contactName,
    'contact.email': contact.email ?? '',
    'job.title': job.title,
    'job.description': job.description ?? '',
    'whatsapp.link': activeWhatsappAccount?.displayPhoneNumber
      ? `https://wa.me/${activeWhatsappAccount.displayPhoneNumber.replace(/\D/g, '')}`
      : '',
    'whatsapp.number': activeWhatsappAccount?.displayPhoneNumber ?? '',
  };
  const previewSubject = selectedTemplate ? resolvePlaceholders(selectedTemplate.subject, previewValues) : '';
  const previewBody = selectedTemplate
    ? resolvePlaceholders(selectedTemplate.body, withLinkedWhatsappNumber(previewValues))
    : '';

  function handleSend() {
    if (!contact.email) {
      toast.error('This contact has no email address on file');
      return;
    }
    if (!emailTemplateId) {
      toast.error('Select an email template');
      return;
    }
    startTransition(async () => {
      const result = await createSubmission({
        jobId: job._id,
        contactId: contact._id,
        channel: 'email',
        emailTemplateId,
        force: true,
      });
      if (result.submission?.emailStatus === 'sent') {
        toast.success(`Email sent to ${contactName}`);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.submission?.emailError ?? result.error ?? 'Email failed to send');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="ghost" size="icon-sm" title="Invite via Email" disabled={!contact.email} />
        }
      >
        <MailIcon className="size-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite {contactName} via Email</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {!contact.email ? (
            <p className="text-sm text-destructive">This contact has no email address on file.</p>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Email Template</span>
                {emailTemplates.length === 0 ? (
                  <p className="text-xs text-destructive">
                    No email templates yet — create one in Email Templates before sending.
                  </p>
                ) : (
                  <Select
                    value={emailTemplateId}
                    onValueChange={(value) => setEmailTemplateId((value as string) ?? '')}
                  >
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
              </div>

              {selectedTemplate ? (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Preview</span>
                  <div className="rounded-none bg-muted/20 p-3 ring-1 ring-foreground/10">
                    <p className="border-b border-foreground/10 pb-2 text-sm font-medium">{previewSubject}</p>
                    <div
                      className="mt-2 max-h-64 overflow-y-auto text-sm [&_a]:text-primary [&_a]:underline [&_p]:mb-2"
                      dangerouslySetInnerHTML={{ __html: previewBody }}
                    />
                  </div>
                </div>
              ) : null}

              <Button onClick={handleSend} disabled={pending || !emailTemplateId} className="w-fit">
                {pending ? 'Sending…' : 'Send Email'}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
