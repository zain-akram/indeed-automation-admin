'use client';

import { CalendarIcon, ChevronsUpDownIcon } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { ContactAutofill } from '@/components/contact-autofill';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { WhatsappIcon } from '@/components/whatsapp-icon';
import { appendContactNotesAction, type AutofillResult } from '@/lib/actions/contacts';
import { createSubmission, type CreateSubmissionInput } from '@/lib/actions/submissions';
import { isValidWhatsapp, WHATSAPP_ERROR, sanitizeWhatsappInput } from '@/lib/phone';
import { renderTemplate } from '@/lib/render-template';
import {
  guessVariableType,
  humanizeVariableName,
  isPositionalTemplate,
  VARIABLE_TYPE_OPTIONS,
  type VariableType,
} from '@/lib/template-variables';
import type {
  Contact,
  DeliveryChannel,
  EmailTemplate,
  Job,
  Submission,
  TemplateDef,
  WhatsappAccount,
} from '@/lib/types';

const NEW_CONTACT_VALUE = '__new__';
const CHANNEL_OPTIONS: { value: DeliveryChannel; label: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp only' },
  { value: 'email', label: 'Email only' },
  { value: 'both', label: 'WhatsApp + Email' },
];

function normalizeWhatsapp(value: string): string {
  return value.replace(/\D/g, '');
}

function formatInterviewDateTime(date: Date, timeOfDay: string): string {
  const [hours, minutes] = timeOfDay.split(':').map(Number);
  const combined = new Date(date);
  combined.setHours(Number.isFinite(hours) ? hours : 9, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return combined.toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
}

interface InterviewFormProps {
  jobs: Job[];
  contacts: Contact[];
  whatsappAccounts: WhatsappAccount[];
  templatesByAccount: Record<string, TemplateDef[]>;
  emailTemplates: EmailTemplate[];
  defaultInterviewLink?: string;
  defaultJobId?: string;
  defaultWhatsappAccountId?: string;
  defaultDeliveryChannel?: DeliveryChannel;
}

export function InterviewForm({
  jobs,
  contacts,
  whatsappAccounts,
  templatesByAccount,
  emailTemplates,
  defaultInterviewLink,
  defaultJobId,
  defaultWhatsappAccountId,
  defaultDeliveryChannel,
}: InterviewFormProps) {
  const [jobId, setJobId] = useState(defaultJobId && jobs.some((j) => j._id === defaultJobId) ? defaultJobId : '');
  const [contactSelection, setContactSelection] = useState('');
  const [newContact, setNewContact] = useState({
    firstName: '',
    lastName: '',
    whatsapp: '',
    email: '',
    notes: '',
  });
  const [whatsappAccountId, setWhatsappAccountId] = useState(
    defaultWhatsappAccountId && whatsappAccounts.some((a) => a._id === defaultWhatsappAccountId)
      ? defaultWhatsappAccountId
      : (whatsappAccounts[0]?._id ?? ''),
  );
  const availableTemplates = templatesByAccount[whatsappAccountId] ?? [];
  const [templateKey, setTemplateKey] = useState(() => {
    const account = whatsappAccounts.find((a) => a._id === whatsappAccountId);
    const accountDefault = account?.defaultTemplateKey;
    return accountDefault && availableTemplates.some((t) => t.key === accountDefault) ? accountDefault : '';
  });
  const [manualVariables, setManualVariables] = useState<Record<string, string>>({});
  const [variableTypes, setVariableTypes] = useState<Record<string, VariableType>>({});
  const [interviewDates, setInterviewDates] = useState<Record<string, Date | undefined>>({});
  const [interviewTimesOfDay, setInterviewTimesOfDay] = useState<Record<string, string>>({});
  const [openDatePopoverFor, setOpenDatePopoverFor] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [duplicateInfo, setDuplicateInfo] = useState<{
    payload: CreateSubmissionInput;
    existingSubmissions: Submission[];
  } | null>(null);
  const [personPopoverOpen, setPersonPopoverOpen] = useState(false);
  const [personSearch, setPersonSearch] = useState('');
  const [channel, setChannel] = useState<DeliveryChannel>(defaultDeliveryChannel ?? 'whatsapp');
  const [emailTemplateId, setEmailTemplateId] = useState(
    () => emailTemplates.find((t) => t.isDefault)?._id ?? emailTemplates[0]?._id ?? '',
  );

  const isNewContact = contactSelection === NEW_CONTACT_VALUE;
  const selectedContact = contacts.find((c) => c._id === contactSelection);
  const filteredContacts = useMemo(() => {
    const query = personSearch.trim().toLowerCase();
    if (!query) {
      return contacts;
    }
    return contacts.filter((c) =>
      `${c.firstName} ${c.lastName} ${c.whatsapp} ${c.notes ?? ''}`.toLowerCase().includes(query),
    );
  }, [contacts, personSearch]);
  const selectedJob = jobs.find((j) => j._id === jobId);
  const selectedTemplate = availableTemplates.find((t) => t.key === templateKey);
  const isPositional = selectedTemplate ? isPositionalTemplate(selectedTemplate.variables) : false;
  const isTemplateApproved = !selectedTemplate?.status || selectedTemplate.status === 'APPROVED';
  const sendsWhatsapp = channel === 'whatsapp' || channel === 'both';
  const sendsEmail = channel === 'email' || channel === 'both';
  const contactEmail = (isNewContact ? newContact.email : (selectedContact?.email ?? '')).trim();

  const contactName = isNewContact
    ? `${newContact.firstName} ${newContact.lastName}`.trim()
    : selectedContact
      ? `${selectedContact.firstName} ${selectedContact.lastName}`.trim()
      : '';

  // Reset per-variable mapping state whenever the selected template changes, and seed sensible
  // defaults (guessed type, and the default interview link for anything link-shaped). Adjusting
  // state during render (rather than in an effect) avoids an extra render pass.
  // Starts as a sentinel (never equal to a real templateKey, including '') so the
  // initialization below also runs for the template selected on the very first render.
  const [variablesInitializedFor, setVariablesInitializedFor] = useState<string | undefined>(undefined);
  if (templateKey !== variablesInitializedFor) {
    setVariablesInitializedFor(templateKey);
    if (!selectedTemplate || isPositionalTemplate(selectedTemplate.variables)) {
      setVariableTypes({});
      setManualVariables({});
    } else {
      const nextTypes: Record<string, VariableType> = {};
      const nextManual: Record<string, string> = {};
      for (const name of selectedTemplate.variables) {
        const guessed = guessVariableType(name);
        nextTypes[name] = guessed;
        if (guessed === 'text' && /link|url/i.test(name) && defaultInterviewLink) {
          nextManual[name] = defaultInterviewLink;
        }
      }
      setVariableTypes(nextTypes);
      setManualVariables(nextManual);
    }
    setInterviewDates({});
    setInterviewTimesOfDay({});
  }

  function resolveVariableValue(name: string): string {
    if (isPositional) {
      return (manualVariables[name] ?? '').trim();
    }
    const type = variableTypes[name] ?? 'text';
    if (type === 'name') {
      return contactName;
    }
    if (type === 'role') {
      return selectedJob?.title ?? '';
    }
    return (manualVariables[name] ?? '').trim();
  }

  const previewText = useMemo(() => {
    if (!selectedTemplate) {
      return '';
    }
    const values: Record<string, string> = {};
    for (const name of selectedTemplate.variables) {
      values[name] = resolveVariableValue(name);
    }
    return renderTemplate(selectedTemplate, values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate, isPositional, variableTypes, manualVariables, contactName, selectedJob]);

  function buildPayload(force: boolean): CreateSubmissionInput | null {
    if (!jobId) {
      toast.error('Select a job');
      return null;
    }
    if (!templateKey || !selectedTemplate) {
      toast.error('Select a template');
      return null;
    }
    if (sendsWhatsapp && !isTemplateApproved) {
      toast.error(
        `"${selectedTemplate.label}" is ${selectedTemplate.status?.toLowerCase()} on WhatsApp and can't be sent yet`,
      );
      return null;
    }
    if (!whatsappAccountId) {
      toast.error('Select a WhatsApp account');
      return null;
    }
    if (isNewContact) {
      if (!newContact.firstName.trim() || !newContact.lastName.trim() || !newContact.whatsapp.trim()) {
        toast.error('Fill in first name, last name and WhatsApp number for the new contact');
        return null;
      }
      if (!isValidWhatsapp(newContact.whatsapp)) {
        toast.error(WHATSAPP_ERROR);
        return null;
      }
    } else if (!contactSelection) {
      toast.error('Select a person');
      return null;
    }
    if (sendsEmail && !contactEmail) {
      toast.error('Add an email address for this contact to send a follow-up email');
      return null;
    }
    if (sendsEmail && !emailTemplateId) {
      toast.error('Select an email template, or create one in Email Templates');
      return null;
    }

    const values: Record<string, string> = {};
    for (const name of selectedTemplate.variables) {
      const value = resolveVariableValue(name);
      if (!value) {
        toast.error(`Fill in "${humanizeVariableName(name)}"`);
        return null;
      }
      values[name] = value;
    }

    return {
      jobId,
      templateKey,
      force,
      whatsappAccountId,
      channel,
      emailTemplateId: sendsEmail ? emailTemplateId : undefined,
      ...(isNewContact
        ? {
            firstName: newContact.firstName.trim(),
            lastName: newContact.lastName.trim(),
            whatsapp: newContact.whatsapp.trim(),
            email: newContact.email.trim() || undefined,
            notes: newContact.notes.trim() || undefined,
          }
        : { contactId: contactSelection }),
      variables: values,
    };
  }

  function resetForm() {
    setJobId(defaultJobId && jobs.some((j) => j._id === defaultJobId) ? defaultJobId : '');
    setContactSelection('');
    setNewContact({ firstName: '', lastName: '', whatsapp: '', email: '', notes: '' });
    const resetAccountId =
      defaultWhatsappAccountId && whatsappAccounts.some((a) => a._id === defaultWhatsappAccountId)
        ? defaultWhatsappAccountId
        : (whatsappAccounts[0]?._id ?? '');
    setWhatsappAccountId(resetAccountId);
    const resetTemplates = templatesByAccount[resetAccountId] ?? [];
    const resetAccount = whatsappAccounts.find((a) => a._id === resetAccountId);
    const resetDefault = resetAccount?.defaultTemplateKey;
    setTemplateKey(resetDefault && resetTemplates.some((t) => t.key === resetDefault) ? resetDefault : '');
    setPersonSearch('');
    setChannel(defaultDeliveryChannel ?? 'whatsapp');
    setEmailTemplateId(emailTemplates.find((t) => t.isDefault)?._id ?? emailTemplates[0]?._id ?? '');
  }

  function handleAutofillResult(result: AutofillResult) {
    const normalizedIncoming = result.whatsapp ? normalizeWhatsapp(result.whatsapp) : undefined;
    const match = normalizedIncoming
      ? contacts.find((c) => normalizeWhatsapp(c.whatsapp) === normalizedIncoming)
      : undefined;

    if (match) {
      setContactSelection(match._id);
      setPersonSearch('');
      setPersonPopoverOpen(false);
      toast.success(`Matched existing contact: ${match.firstName} ${match.lastName}`);
      if (result.notes) {
        const mergedNotes = match.notes ? `${match.notes}\n${result.notes}` : result.notes;
        appendContactNotesAction(match._id, mergedNotes).catch(() => {
          toast.error(`Could not save extracted details to ${match.firstName}'s notes`);
        });
      }
      return;
    }

    setContactSelection(NEW_CONTACT_VALUE);
    setNewContact((c) => ({
      firstName: result.firstName ?? c.firstName,
      lastName: result.lastName ?? c.lastName,
      whatsapp: result.whatsapp ? sanitizeWhatsappInput(result.whatsapp) : c.whatsapp,
      email: result.email ?? c.email,
      notes: result.notes ? (c.notes ? `${c.notes}\n${result.notes}` : result.notes) : c.notes,
    }));
    toast.success('Fields autofilled — please review before saving');
  }

  function handleSend() {
    const payload = buildPayload(false);
    if (!payload) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await createSubmission(payload);
        if (result.duplicate) {
          setDuplicateInfo({
            payload,
            existingSubmissions: result.existingSubmissions ?? [],
          });
          return;
        }
        if (result.submission?.status === 'sent') {
          toast.success('Message sent');
          resetForm();
        } else {
          toast.error(result.submission?.errorMessage ?? 'Message failed to send');
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to submit');
      }
    });
  }

  function handleForceSend() {
    if (!duplicateInfo) {
      return;
    }
    const payload = { ...duplicateInfo.payload, force: true };
    startTransition(async () => {
      try {
        const result = await createSubmission(payload);
        if (result.submission?.status === 'sent') {
          toast.success('Message sent');
          resetForm();
        } else {
          toast.error(result.submission?.errorMessage ?? 'Message failed to send');
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to submit');
      } finally {
        setDuplicateInfo(null);
      }
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Job</h2>
          <Select value={jobId} onValueChange={(value) => setJobId(value ?? '')}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a job">{() => selectedJob?.title ?? 'Select a job'}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {jobs.map((job) => (
                <SelectItem key={job._id} value={job._id}>
                  {job.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Person</h2>
          <ContactAutofill onResult={handleAutofillResult} />

          <Popover
            open={personPopoverOpen}
            onOpenChange={(open) => {
              setPersonPopoverOpen(open);
              if (!open) {
                setPersonSearch('');
              }
            }}
          >
            <PopoverTrigger render={<Button variant="outline" className="w-full justify-between font-normal" />}>
              <span className="truncate">
                {isNewContact
                  ? '+ Add new contact'
                  : selectedContact
                    ? `${selectedContact.firstName} ${selectedContact.lastName} — ${selectedContact.whatsapp}`
                    : 'Select a person'}
              </span>
              <ChevronsUpDownIcon className="opacity-50" />
            </PopoverTrigger>
            <PopoverContent className="w-(--anchor-width) p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  autoFocus
                  value={personSearch}
                  onValueChange={setPersonSearch}
                  placeholder="Search name, number, or notes…"
                />
                <CommandList>
                  <CommandEmpty>No matches.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="add new contact"
                      onSelect={() => {
                        setContactSelection(NEW_CONTACT_VALUE);
                        setPersonPopoverOpen(false);
                      }}
                    >
                      + Add new contact
                    </CommandItem>
                    {filteredContacts.map((contact) => (
                      <CommandItem
                        key={contact._id}
                        value={contact._id}
                        onSelect={() => {
                          setContactSelection(contact._id);
                          setPersonPopoverOpen(false);
                        }}
                      >
                        {contact.firstName} {contact.lastName} — {contact.whatsapp}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {isNewContact ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    value={newContact.firstName}
                    onChange={(e) =>
                      setNewContact((c) => ({
                        ...c,
                        firstName: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    value={newContact.lastName}
                    onChange={(e) =>
                      setNewContact((c) => ({
                        ...c,
                        lastName: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="whatsapp">WhatsApp number</Label>
                  <Input
                    id="whatsapp"
                    placeholder="923001234567"
                    value={newContact.whatsapp}
                    onChange={(e) =>
                      setNewContact((c) => ({
                        ...c,
                        whatsapp: sanitizeWhatsappInput(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="candidate@example.com"
                    value={newContact.email}
                    onChange={(e) => setNewContact((c) => ({ ...c, email: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    rows={2}
                    value={newContact.notes}
                    onChange={(e) => setNewContact((c) => ({ ...c, notes: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Template</h2>
          <Select value={templateKey} onValueChange={(value) => setTemplateKey(value ?? '')}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a template">
                {() => selectedTemplate?.label ?? 'Select a template'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {availableTemplates.map((template) => {
                const isApproved = !template.status || template.status === 'APPROVED';
                return (
                  <SelectItem key={template.key} value={template.key}>
                    {template.label}
                    {isApproved ? '' : ` — ${template.status}`}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {availableTemplates.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No templates synced for this WhatsApp account yet. Sync templates in Settings first.
            </p>
          ) : null}
          {selectedTemplate && !isTemplateApproved ? (
            <p className="text-xs text-destructive">
              {`This template is ${selectedTemplate.status?.toLowerCase()} on WhatsApp — it can't be sent until Meta approves it.`}
            </p>
          ) : null}

          {selectedTemplate && isPositional
            ? selectedTemplate.variables.map((name) => (
                <div
                  key={name}
                  className="flex items-center gap-2 border-b border-foreground/10 pb-2 last:border-b-0 last:pb-0"
                >
                  <Label htmlFor={name} className="w-28 shrink-0 text-xs text-muted-foreground">
                    {humanizeVariableName(name)}
                  </Label>
                  <Input
                    id={name}
                    className="h-8 flex-1 text-xs"
                    value={manualVariables[name] ?? ''}
                    onChange={(e) => setManualVariables((v) => ({ ...v, [name]: e.target.value }))}
                  />
                </div>
              ))
            : (selectedTemplate?.variables ?? []).map((name) => {
                const type = variableTypes[name] ?? 'text';
                const typeLabel = VARIABLE_TYPE_OPTIONS.find((opt) => opt.value === type)?.label ?? type;
                return (
                  <div
                    key={name}
                    className="flex flex-wrap items-center gap-2 border-b border-foreground/10 pb-2 last:border-b-0 last:pb-0"
                  >
                    <span className="w-28 shrink-0 text-xs text-muted-foreground">{humanizeVariableName(name)}</span>

                    <div className="min-w-0 flex-1">
                      {type === 'name' ? (
                        <p className="truncate text-xs text-foreground">{contactName || '—'}</p>
                      ) : type === 'role' ? (
                        <p className="truncate text-xs text-foreground">{selectedJob?.title || '—'}</p>
                      ) : type === 'date' ? (
                        <div className="flex gap-1.5">
                          <Popover
                            open={openDatePopoverFor === name}
                            onOpenChange={(open) => setOpenDatePopoverFor(open ? name : null)}
                          >
                            <PopoverTrigger
                              render={
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 flex-1 justify-start text-xs font-normal"
                                />
                              }
                            >
                              <CalendarIcon className="opacity-50" />
                              {interviewDates[name]
                                ? interviewDates[name]!.toLocaleDateString('en-US', { dateStyle: 'medium' })
                                : 'Pick a date'}
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={interviewDates[name]}
                                onSelect={(date) => {
                                  setInterviewDates((d) => ({ ...d, [name]: date }));
                                  setOpenDatePopoverFor(null);
                                  if (date) {
                                    setManualVariables((v) => ({
                                      ...v,
                                      [name]: formatInterviewDateTime(date, interviewTimesOfDay[name] ?? '09:00'),
                                    }));
                                  }
                                }}
                              />
                            </PopoverContent>
                          </Popover>
                          <Input
                            type="time"
                            className="h-8 w-24 shrink-0 text-xs"
                            value={interviewTimesOfDay[name] ?? '09:00'}
                            onChange={(e) => {
                              setInterviewTimesOfDay((t) => ({ ...t, [name]: e.target.value }));
                              const date = interviewDates[name];
                              if (date) {
                                setManualVariables((v) => ({
                                  ...v,
                                  [name]: formatInterviewDateTime(date, e.target.value),
                                }));
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className="flex gap-1.5">
                          <Input
                            id={name}
                            className="h-8 flex-1 text-xs"
                            value={manualVariables[name] ?? ''}
                            onChange={(e) => setManualVariables((v) => ({ ...v, [name]: e.target.value }))}
                          />
                          {defaultInterviewLink ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 shrink-0 text-xs"
                              onClick={() => setManualVariables((v) => ({ ...v, [name]: defaultInterviewLink }))}
                            >
                              Use default
                            </Button>
                          ) : null}
                        </div>
                      )}
                    </div>

                    <Select
                      value={type}
                      onValueChange={(value) =>
                        setVariableTypes((t) => ({ ...t, [name]: (value as VariableType) ?? 'text' }))
                      }
                    >
                      <SelectTrigger size="sm" className="w-40 shrink-0 text-xs">
                        <SelectValue>{() => typeLabel}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {VARIABLE_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">Delivery Channel</h2>
          <Select value={channel} onValueChange={(value) => setChannel((value as DeliveryChannel) ?? 'whatsapp')}>
            <SelectTrigger className="w-full">
              <SelectValue>{() => CHANNEL_OPTIONS.find((o) => o.value === channel)?.label}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {CHANNEL_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {sendsEmail && !contactEmail ? (
            <p className="text-xs text-destructive">
              This contact has no email address — add one above, or switch to WhatsApp only.
            </p>
          ) : null}
        </div>

        {sendsEmail ? (
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-medium">Email Template</h2>
            {emailTemplates.length === 0 ? (
              <p className="text-xs text-destructive">
                No email templates yet — create one in Email Templates before sending.
              </p>
            ) : (
              <Select value={emailTemplateId} onValueChange={(value) => setEmailTemplateId((value as string) ?? '')}>
                <SelectTrigger className="w-full">
                  <SelectValue>{() => emailTemplates.find((t) => t._id === emailTemplateId)?.label}</SelectValue>
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
        ) : null}

        <Button onClick={handleSend} disabled={pending || (sendsWhatsapp && !isTemplateApproved)} className="w-fit">
          {pending ? 'Sending…' : 'Send Message'}
        </Button>
      </div>

      <div className="flex flex-col gap-4 lg:sticky lg:top-6 lg:h-fit">
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">WhatsApp Account</h2>
          <Select
            value={whatsappAccountId}
            onValueChange={(value) => {
              const nextAccountId = value ?? '';
              setWhatsappAccountId(nextAccountId);
              const nextTemplates = templatesByAccount[nextAccountId] ?? [];
              const nextAccount = whatsappAccounts.find((a) => a._id === nextAccountId);
              const nextDefault = nextAccount?.defaultTemplateKey;
              if (nextDefault && nextTemplates.some((t) => t.key === nextDefault)) {
                setTemplateKey(nextDefault);
              } else if (!nextTemplates.some((t) => t.key === templateKey)) {
                setTemplateKey('');
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a WhatsApp account">
                {() => {
                  const account = whatsappAccounts.find((a) => a._id === whatsappAccountId);
                  return account ? (
                    <span className="flex items-center gap-1.5">
                      <WhatsappIcon className="size-3.5 shrink-0 text-muted-foreground" />
                      {account.label}
                    </span>
                  ) : (
                    'Select a WhatsApp account'
                  );
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {whatsappAccounts.map((account) => (
                <SelectItem key={account._id} value={account._id}>
                  <WhatsappIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  {account.label}
                  {account.isActive ? ' (Active)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Defaults to the active account. The message sends from here.</p>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Message Preview</h2>
          <div className="rounded-none bg-muted/20 p-4 ring-1 ring-foreground/10">
            {previewText ? (
              <p className="text-sm whitespace-pre-wrap">{previewText}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Select a template to see a preview.</p>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={duplicateInfo !== null} onOpenChange={(open) => !open && setDuplicateInfo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Already submitted for this job</AlertDialogTitle>
            <AlertDialogDescription>
              This contact already has {duplicateInfo?.existingSubmissions.length ?? 0} submission(s) for this job. Send
              this message anyway?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="list-disc pl-5 text-sm text-muted-foreground">
            {duplicateInfo?.existingSubmissions.map((s) => (
              <li key={s._id}>
                {s.templateKey} — {s.status} ({new Date(s.createdAt).toLocaleString()})
              </li>
            ))}
          </ul>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={pending || (sendsWhatsapp && !isTemplateApproved)} onClick={handleForceSend}>
              Send Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
