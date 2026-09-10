'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { resolvePlaceholders } from '@/lib/email-placeholders';
import type { Contact, EmailTemplate, Job } from '@/lib/types';

export function EmailPreviewButton({
  template,
  contact,
  job,
}: {
  template: EmailTemplate;
  contact: Contact | null;
  job: Job | null;
}) {
  const values: Record<string, string> = {
    'contact.name': contact ? `${contact.firstName} ${contact.lastName}`.trim() : '',
    'contact.email': contact?.email ?? '',
    'job.title': job?.title ?? '',
    'job.description': job?.description ?? '',
  };
  const subject = resolvePlaceholders(template.subject, values);
  const body = resolvePlaceholders(template.body, values);

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>View Email</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{subject}</DialogTitle>
        </DialogHeader>
        <div
          className="max-h-96 overflow-y-auto text-sm text-foreground [&_a]:text-primary [&_a]:underline [&_p]:mb-2"
          dangerouslySetInnerHTML={{ __html: body }}
        />
        <p className="text-xs text-muted-foreground">
          WhatsApp link/number placeholders aren&apos;t shown in this preview — the actual email resolves them to the
          account that sent it.
        </p>
      </DialogContent>
    </Dialog>
  );
}
