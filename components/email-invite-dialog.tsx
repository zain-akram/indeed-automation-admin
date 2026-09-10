'use client';

import { MailIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
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
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createSubmission } from '@/lib/actions/submissions';
import { resolvePlaceholders, withLinkedWhatsappNumber } from '@/lib/email-placeholders';
import type { Contact, EmailTemplate, Job, Submission, WhatsappAccount } from '@/lib/types';

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
  const [existingSubmissions, setExistingSubmissions] = useState<Submission[] | null>(null);

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

  function describeSubmission(s: Submission): string {
    if (s.templateKey) return s.templateKey;
    if (s.emailTemplateId) return emailTemplates.find((t) => t._id === s.emailTemplateId)?.label ?? 'Email';
    return 'Email only';
  }

  function handleSend(force = false) {
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
        force,
      });
      if (result.duplicate) {
        setExistingSubmissions(result.existingSubmissions ?? []);
        return;
      }
      if (result.submission?.emailStatus === 'sent') {
        toast.success(`Email sent to ${contactName}`);
        setOpen(false);
        setExistingSubmissions(null);
        router.refresh();
      } else {
        toast.error(result.submission?.emailError ?? result.error ?? 'Email failed to send');
      }
    });
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    setExistingSubmissions(null);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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

              <Button onClick={() => handleSend(false)} disabled={pending || !emailTemplateId} className="w-fit">
                {pending ? 'Sending…' : 'Send Email'}
              </Button>
            </>
          )}
        </div>
      </DialogContent>

      <AlertDialog open={existingSubmissions !== null} onOpenChange={(open) => !open && setExistingSubmissions(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Already submitted for this job</AlertDialogTitle>
            <AlertDialogDescription>
              {contactName} already has {existingSubmissions?.length ?? 0} submission(s) for this job. Send this email
              anyway?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="list-disc pl-5 text-sm text-muted-foreground">
            {existingSubmissions?.map((s) => (
              <li key={s._id}>
                {describeSubmission(s)} —{' '}
                {s.status === 'sent' || s.status === 'failed' ? s.status : (s.emailStatus ?? 'skipped')} (
                {new Date(s.createdAt).toLocaleString()})
              </li>
            ))}
          </ul>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={pending} onClick={() => handleSend(true)}>
              Send Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
