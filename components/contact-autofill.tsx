'use client';

import { SparklesIcon } from 'lucide-react';
import { useEffect, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { autofillContactAction, type AutofillResult } from '@/lib/actions/contacts';

export function ContactAutofill({ onResult }: { onResult: (result: AutofillResult) => void }) {
  const [pending, startTransition] = useTransition();
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function runAutofill(file: File) {
    const formData = new FormData();
    formData.set('file', file, file.name || 'pasted-image.png');
    startTransition(async () => {
      const result = await autofillContactAction(formData);
      if (result.data) {
        onResult(result.data);
      } else {
        toast.error(result.error ?? 'Failed to autofill from image');
      }
    });
  }

  const runAutofillRef = useRef(runAutofill);
  useEffect(() => {
    runAutofillRef.current = runAutofill;
  });

  useEffect(() => {
    function handleDocumentPaste(e: ClipboardEvent) {
      const item = e.clipboardData ? [...e.clipboardData.items].find((i) => i.kind === 'file') : undefined;
      const file = item?.getAsFile();
      if (file) {
        e.preventDefault();
        runAutofillRef.current(file);
      }
    }

    document.addEventListener('paste', handleDocumentPaste);
    return () => document.removeEventListener('paste', handleDocumentPaste);
  }, []);

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      runAutofill(file);
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      runAutofill(file);
    }
    e.target.value = '';
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => fileInputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          fileInputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      className={cn(
        'flex cursor-pointer items-center justify-center gap-2 rounded-none border border-dashed p-3 text-center text-xs text-muted-foreground transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring/50',
        dragActive ? 'border-primary bg-primary/5' : 'border-border',
      )}
    >
      <SparklesIcon className="size-4 shrink-0" />
      <span>{pending ? 'Reading screenshot…' : 'Paste, drag, or click to autofill from a screenshot'}</span>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
}
