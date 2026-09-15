'use client';

import { SparklesIcon } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { generateEmailTemplateAction, type GeneratedEmailTemplate } from '@/lib/actions/email-templates';

interface AiTemplateDialogProps {
  hasContent: boolean;
  currentSubject: string;
  currentBody: string;
  onGenerated: (result: GeneratedEmailTemplate) => void;
}

export function AiTemplateDialog({ hasContent, currentSubject, currentBody, onGenerated }: AiTemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [pending, startTransition] = useTransition();

  function handleGenerate() {
    if (!prompt.trim()) {
      toast.error('Describe what you want the template to say');
      return;
    }
    const formData = new FormData();
    formData.set('prompt', prompt.trim());
    if (hasContent) {
      formData.set('currentSubject', currentSubject);
      formData.set('currentBody', currentBody);
    }
    startTransition(async () => {
      const state = await generateEmailTemplateAction({}, formData);
      if (state.result) {
        onGenerated(state.result);
        toast.success(hasContent ? 'Template updated' : 'Template generated');
        setPrompt('');
        setOpen(false);
      } else {
        toast.error(state.error ?? 'Failed to generate template');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="outline" onClick={() => setOpen(true)} className="w-fit">
        <SparklesIcon className="size-4" />
        {hasContent ? 'Edit with AI' : 'Create with AI'}
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{hasContent ? 'Edit template with AI' : 'Create template with AI'}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Textarea
            autoFocus
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              hasContent
                ? 'e.g. Make it shorter and more urgent'
                : 'e.g. A friendly follow-up asking the candidate to confirm availability for a WhatsApp chat'
            }
          />
          <p className="text-xs text-muted-foreground">
            {hasContent
              ? 'Describe what to change — the AI sees the current subject and body and revises them.'
              : 'Describe the email you want — the AI writes a subject and body using the same placeholders you can use manually.'}
          </p>
        </div>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="ghost" />}>Cancel</DialogClose>
          <Button type="button" onClick={handleGenerate} disabled={pending}>
            {pending ? 'Generating…' : 'Generate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
