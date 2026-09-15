'use client';

import { useActionState, useState } from 'react';
import { AiTemplateDialog } from '@/components/ai-template-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlaceholderLineInput } from '@/components/placeholder-line-input';
import { RichTextEditor } from '@/components/rich-text-editor';
import type { EmailTemplateFormState, GeneratedEmailTemplate } from '@/lib/actions/email-templates';
import { resolveEmailBody, resolvePlaceholders, SAMPLE_PLACEHOLDER_VALUES } from '@/lib/email-placeholders';
import type { EmailTemplate } from '@/lib/types';

interface EmailTemplateFormProps {
  action: (state: EmailTemplateFormState, formData: FormData) => Promise<EmailTemplateFormState>;
  initial?: EmailTemplate;
  submitLabel: string;
}

export function EmailTemplateForm({ action, initial, submitLabel }: EmailTemplateFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const idSuffix = initial?._id ?? 'new';
  const [label, setLabel] = useState(initial?.label ?? '');
  const [subject, setSubject] = useState(initial?.subject ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [whatsappMessage, setWhatsappMessage] = useState(initial?.whatsappMessage ?? '');
  const [whatsappLinkText, setWhatsappLinkText] = useState(initial?.whatsappLinkText ?? '');
  // Bumped whenever AI (re)generates content — the subject/body editors are Tiptap-based and only
  // read their initial content once on mount, so forcing a remount via `key` is how new AI content
  // actually shows up in them.
  const [aiVersion, setAiVersion] = useState(0);

  const previewSubject = resolvePlaceholders(subject, SAMPLE_PLACEHOLDER_VALUES);
  const previewBody = resolveEmailBody(body, SAMPLE_PLACEHOLDER_VALUES, whatsappLinkText);

  function handleAiGenerated(result: GeneratedEmailTemplate) {
    setLabel(result.label);
    setSubject(result.subject);
    setBody(result.body);
    setAiVersion((v) => v + 1);
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <form action={formAction} className="flex flex-col gap-4">
        <AiTemplateDialog
          hasContent={Boolean(subject.trim() || body.trim())}
          currentSubject={subject}
          currentBody={body}
          onGenerated={handleAiGenerated}
        />
        <div className="flex flex-col gap-2">
          <Label htmlFor="label">Label</Label>
          <Input
            id="label"
            name="label"
            placeholder="e.g. Next Steps"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Input
            key={`description-${idSuffix}`}
            id="description"
            name="description"
            placeholder="What this template is used for"
            defaultValue={initial?.description}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="subject">Subject</Label>
          <input type="hidden" name="subject" value={subject} />
          <PlaceholderLineInput
            key={`subject-${idSuffix}-${aiVersion}`}
            id="subject"
            value={subject}
            onChange={setSubject}
            placeholder="Email subject"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Body</Label>
          <input type="hidden" name="body" value={body} />
          <input type="hidden" name="whatsappMessage" value={whatsappMessage} />
          <input type="hidden" name="whatsappLinkText" value={whatsappLinkText} />
          <RichTextEditor
            key={`body-${idSuffix}-${aiVersion}`}
            value={body}
            onChange={setBody}
            whatsappMessage={whatsappMessage}
            onWhatsappMessageChange={setWhatsappMessage}
            whatsappLinkText={whatsappLinkText}
            onWhatsappLinkTextChange={setWhatsappLinkText}
          />
          <p className="text-xs text-muted-foreground">
            Type <code>{'{{'}</code> in the subject or body to insert a field (Candidate, Job, or WhatsApp details).
            Select text and click the link icon to make it clickable. Double-click a WhatsApp field to customize its
            prefilled message.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="replyTo">Reply-To (optional)</Label>
          <Input
            key={`replyTo-${idSuffix}`}
            id="replyTo"
            name="replyTo"
            type="email"
            placeholder="Uses the account default if left blank"
            defaultValue={initial?.replyTo}
          />
        </div>
        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <Button type="submit" disabled={pending} className="w-fit">
          {pending ? 'Saving…' : submitLabel}
        </Button>
      </form>

      <Card className="lg:sticky lg:top-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Preview</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="border-b border-input pb-3 text-sm font-medium">
            {previewSubject || <span className="text-muted-foreground">Subject appears here</span>}
          </div>
          <div
            className="max-h-[28rem] overflow-y-auto text-sm text-foreground [&_a]:text-primary [&_a]:underline [&_p]:mb-2"
            dangerouslySetInnerHTML={{
              __html: previewBody || '<p class="text-muted-foreground">Body appears here</p>',
            }}
          />
          <p className="text-xs text-muted-foreground">
            Shown with sample data — the real email uses the recipient&apos;s.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
