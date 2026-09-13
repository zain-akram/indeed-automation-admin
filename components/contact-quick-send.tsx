'use client';

import { useState } from 'react';
import { EmailInviteDialog } from '@/components/email-invite-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WhatsappInviteDialog } from '@/components/whatsapp-invite-dialog';
import type { Contact, EmailTemplate, Job, TemplateDef, WhatsappAccount } from '@/lib/types';

interface ContactQuickSendProps {
  contact: Contact;
  jobs: Job[];
  defaultJobId?: string;
  whatsappAccounts: WhatsappAccount[];
  templatesByAccount: Record<string, TemplateDef[]>;
  defaultWhatsappAccountId?: string;
  emailTemplates: EmailTemplate[];
}

export function ContactQuickSend({
  contact,
  jobs,
  defaultJobId,
  whatsappAccounts,
  templatesByAccount,
  defaultWhatsappAccountId,
  emailTemplates,
}: ContactQuickSendProps) {
  const [jobId, setJobId] = useState(
    defaultJobId && jobs.some((j) => j._id === defaultJobId) ? defaultJobId : (jobs[0]?._id ?? ''),
  );
  const job = jobs.find((j) => j._id === jobId);

  if (jobs.length === 0) {
    return <p className="text-sm text-muted-foreground">Add a job first to send a message about it.</p>;
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-2">
        <Label>Job</Label>
        <Select value={jobId} onValueChange={(value) => setJobId(value ?? '')}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Select a job">{() => job?.title ?? 'Select a job'}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {jobs.map((j) => (
              <SelectItem key={j._id} value={j._id}>
                {j.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {job ? (
        <div className="flex items-center gap-1 rounded-none bg-muted/20 p-1 ring-1 ring-foreground/10">
          <WhatsappInviteDialog
            key={`wa-${job._id}`}
            job={job}
            contact={contact}
            whatsappAccounts={whatsappAccounts}
            templatesByAccount={templatesByAccount}
            defaultWhatsappAccountId={defaultWhatsappAccountId}
          />
          <EmailInviteDialog
            key={`email-${job._id}`}
            job={job}
            contact={contact}
            emailTemplates={emailTemplates}
            whatsappAccounts={whatsappAccounts}
          />
        </div>
      ) : null}
    </div>
  );
}
