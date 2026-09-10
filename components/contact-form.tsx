'use client';

import { useActionState, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ContactAutofill } from '@/components/contact-autofill';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createContactAction, type ContactFormState } from '@/lib/actions/contacts';
import { sanitizeWhatsappInput } from '@/lib/phone';
import type { Contact } from '@/lib/types';

interface ContactFormProps {
  action?: (state: ContactFormState, formData: FormData) => Promise<ContactFormState>;
  initial?: Contact;
  submitLabel?: string;
}

export function ContactForm({
  action = createContactAction,
  initial,
  submitLabel = 'Create Contact',
}: ContactFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const idSuffix = initial?._id ?? 'new';
  const [firstName, setFirstName] = useState(initial?.firstName ?? '');
  const [lastName, setLastName] = useState(initial?.lastName ?? '');
  const [whatsapp, setWhatsapp] = useState(initial?.whatsapp ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      {!initial ? (
        <ContactAutofill
          onResult={(result) => {
            if (result.firstName) setFirstName(result.firstName);
            if (result.lastName) setLastName(result.lastName);
            if (result.whatsapp) setWhatsapp(sanitizeWhatsappInput(result.whatsapp));
            if (result.email) setEmail(result.email);
            if (result.notes) setNotes((n) => (n ? `${n}\n${result.notes}` : result.notes!));
            toast.success('Fields autofilled — please review before saving');
          }}
        />
      ) : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="firstName">First name</Label>
          <Input
            key={`firstName-${idSuffix}`}
            id="firstName"
            name="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input
            key={`lastName-${idSuffix}`}
            id="lastName"
            name="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="whatsapp">WhatsApp number</Label>
        <Input
          key={`whatsapp-${idSuffix}`}
          id="whatsapp"
          name="whatsapp"
          placeholder="923001234567"
          pattern="\+?(923\d{9}|(?!92)\d{8,15})"
          title="Include the country code, e.g. 923001234567 for Pakistan or 971501234567 for the UAE"
          value={whatsapp}
          onChange={(e) => setWhatsapp(sanitizeWhatsappInput(e.target.value))}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          key={`email-${idSuffix}`}
          id="email"
          name="email"
          type="email"
          placeholder="candidate@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          key={`notes-${idSuffix}`}
          id="notes"
          name="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? 'Saving…' : submitLabel}
      </Button>
    </form>
  );
}
