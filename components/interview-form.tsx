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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createSubmission, type CreateSubmissionInput } from '@/lib/actions/submissions';
import { renderTemplate } from '@/lib/render-template';
import type { Contact, Job, Submission, TemplateDef } from '@/lib/types';

const NEW_CONTACT_VALUE = '__new__';
const INTERVIEW_TIME_VARIABLE = 'interview_time';
const INTERVIEW_LINK_VARIABLE = 'linterview_ink';

function formatInterviewDateTime(date: Date, timeOfDay: string): string {
  const [hours, minutes] = timeOfDay.split(':').map(Number);
  const combined = new Date(date);
  combined.setHours(Number.isFinite(hours) ? hours : 9, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return combined.toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });
}

interface InterviewFormProps {
  jobs: Job[];
  contacts: Contact[];
  templates: TemplateDef[];
  defaultInterviewLink?: string;
}

export function InterviewForm({ jobs, contacts, templates, defaultInterviewLink }: InterviewFormProps) {
  const [jobId, setJobId] = useState('');
  const [contactSelection, setContactSelection] = useState('');
  const [newContact, setNewContact] = useState({ firstName: '', lastName: '', whatsapp: '', notes: '' });
  const [templateKey, setTemplateKey] = useState('');
  const [manualVariables, setManualVariables] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [duplicateInfo, setDuplicateInfo] = useState<{
    payload: CreateSubmissionInput;
    existingSubmissions: Submission[];
  } | null>(null);
  const [personPopoverOpen, setPersonPopoverOpen] = useState(false);
  const [interviewDate, setInterviewDate] = useState<Date | undefined>(undefined);
  const [interviewTimeOfDay, setInterviewTimeOfDay] = useState('09:00');
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  const isNewContact = contactSelection === NEW_CONTACT_VALUE;
  const selectedContact = contacts.find((c) => c._id === contactSelection);
  const selectedJob = jobs.find((j) => j._id === jobId);
  const selectedTemplate = templates.find((t) => t.key === templateKey);

  const contactName = isNewContact
    ? `${newContact.firstName} ${newContact.lastName}`.trim()
    : selectedContact
      ? `${selectedContact.firstName} ${selectedContact.lastName}`.trim()
      : '';

  const previewText = useMemo(() => {
    if (!selectedTemplate) {
      return '';
    }
    const values: Record<string, string> = {};
    for (const variable of selectedTemplate.variables) {
      if (variable.source === 'contact') {
        values[variable.name] = contactName;
      } else if (variable.source === 'job') {
        values[variable.name] = selectedJob?.title ?? '';
      } else {
        values[variable.name] = manualVariables[variable.name] ?? '';
      }
    }
    return renderTemplate(selectedTemplate, values);
  }, [selectedTemplate, contactName, selectedJob, manualVariables]);

  function buildPayload(force: boolean): CreateSubmissionInput | null {
    if (!jobId) {
      toast.error('Select a job');
      return null;
    }
    if (!templateKey) {
      toast.error('Select a template');
      return null;
    }
    if (isNewContact) {
      if (!newContact.firstName.trim() || !newContact.lastName.trim() || !newContact.whatsapp.trim()) {
        toast.error('Fill in first name, last name and WhatsApp number for the new contact');
        return null;
      }
    } else if (!contactSelection) {
      toast.error('Select a person');
      return null;
    }

    const manualDefs = selectedTemplate?.variables.filter((v) => v.source === 'manual') ?? [];
    for (const variable of manualDefs) {
      if (!manualVariables[variable.name]?.trim()) {
        toast.error(`Fill in "${variable.label}"`);
        return null;
      }
    }

    return {
      jobId,
      templateKey,
      force,
      ...(isNewContact
        ? {
            firstName: newContact.firstName.trim(),
            lastName: newContact.lastName.trim(),
            whatsapp: newContact.whatsapp.trim(),
            notes: newContact.notes.trim() || undefined,
          }
        : { contactId: contactSelection }),
      variables: Object.fromEntries(manualDefs.map((v) => [v.name, manualVariables[v.name]?.trim() ?? ''])),
    };
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
          setDuplicateInfo({ payload, existingSubmissions: result.existingSubmissions ?? [] });
          return;
        }
        if (result.submission?.status === 'sent') {
          toast.success('Message sent');
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
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Job</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Person</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Popover open={personPopoverOpen} onOpenChange={setPersonPopoverOpen}>
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
                <Command>
                  <CommandInput placeholder="Search name, number, or notes…" />
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
                      {contacts.map((contact) => (
                        <CommandItem
                          key={contact._id}
                          value={`${contact.firstName} ${contact.lastName} ${contact.whatsapp} ${contact.notes ?? ''}`}
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    value={newContact.firstName}
                    onChange={(e) => setNewContact((c) => ({ ...c, firstName: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    value={newContact.lastName}
                    onChange={(e) => setNewContact((c) => ({ ...c, lastName: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="whatsapp">WhatsApp number</Label>
                  <Input
                    id="whatsapp"
                    placeholder="+14155552671"
                    value={newContact.whatsapp}
                    onChange={(e) => setNewContact((c) => ({ ...c, whatsapp: e.target.value }))}
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
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Template</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Select value={templateKey} onValueChange={(value) => setTemplateKey(value ?? '')}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a template">
                  {() => selectedTemplate?.label ?? 'Select a template'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.key} value={template.key}>
                    {template.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedTemplate?.variables
              .filter((v) => v.source === 'manual')
              .map((variable) =>
                variable.name === INTERVIEW_TIME_VARIABLE ? (
                  <div key={variable.name} className="flex flex-col gap-2">
                    <Label>{variable.label}</Label>
                    <div className="flex gap-2">
                      <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                        <PopoverTrigger
                          render={<Button variant="outline" className="flex-1 justify-start font-normal" />}
                        >
                          <CalendarIcon className="opacity-50" />
                          {interviewDate ? interviewDate.toLocaleDateString('en-US', { dateStyle: 'medium' }) : 'Pick a date'}
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={interviewDate}
                            onSelect={(date) => {
                              setInterviewDate(date);
                              setDatePopoverOpen(false);
                              if (date) {
                                setManualVariables((v) => ({
                                  ...v,
                                  [INTERVIEW_TIME_VARIABLE]: formatInterviewDateTime(date, interviewTimeOfDay),
                                }));
                              }
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      <Input
                        type="time"
                        className="w-32"
                        value={interviewTimeOfDay}
                        onChange={(e) => {
                          setInterviewTimeOfDay(e.target.value);
                          if (interviewDate) {
                            setManualVariables((v) => ({
                              ...v,
                              [INTERVIEW_TIME_VARIABLE]: formatInterviewDateTime(interviewDate, e.target.value),
                            }));
                          }
                        }}
                      />
                    </div>
                  </div>
                ) : variable.name === INTERVIEW_LINK_VARIABLE ? (
                  <div key={variable.name} className="flex flex-col gap-2">
                    <Label htmlFor={variable.name}>{variable.label}</Label>
                    <div className="flex gap-2">
                      <Input
                        id={variable.name}
                        value={manualVariables[variable.name] ?? ''}
                        onChange={(e) => setManualVariables((v) => ({ ...v, [variable.name]: e.target.value }))}
                      />
                      {defaultInterviewLink ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="shrink-0"
                          onClick={() =>
                            setManualVariables((v) => ({ ...v, [INTERVIEW_LINK_VARIABLE]: defaultInterviewLink }))
                          }
                        >
                          Use default
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div key={variable.name} className="flex flex-col gap-2">
                    <Label htmlFor={variable.name}>{variable.label}</Label>
                    <Input
                      id={variable.name}
                      value={manualVariables[variable.name] ?? ''}
                      onChange={(e) => setManualVariables((v) => ({ ...v, [variable.name]: e.target.value }))}
                    />
                  </div>
                ),
              )}
          </CardContent>
        </Card>

        <Button onClick={handleSend} disabled={pending} className="w-fit">
          {pending ? 'Sending…' : 'Send Message'}
        </Button>
      </div>

      <Card className="h-fit lg:sticky lg:top-6">
        <CardHeader>
          <CardTitle>Message Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {previewText ? (
            <p className="whitespace-pre-wrap rounded-none bg-muted/30 p-4 text-sm ring-1 ring-foreground/10">
              {previewText}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Select a template to see a preview.</p>
          )}
        </CardContent>
      </Card>

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
            <AlertDialogAction disabled={pending} onClick={handleForceSend}>
              Send Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
