'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { JobFormState } from '@/lib/actions/jobs';
import type { Job } from '@/lib/types';

interface JobFormProps {
  action: (state: JobFormState, formData: FormData) => Promise<JobFormState>;
  initial?: Job;
  submitLabel: string;
  showActiveToggle?: boolean;
}

export function JobForm({ action, initial, submitLabel, showActiveToggle }: JobFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Title</Label>
        <Input key={`title-${initial?._id ?? 'new'}`} id="title" name="title" defaultValue={initial?.title} required autoFocus />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          key={`description-${initial?._id ?? 'new'}`}
          id="description"
          name="description"
          defaultValue={initial?.description}
          rows={4}
        />
      </div>
      {showActiveToggle ? (
        <div className="flex items-center gap-2">
          <Switch
            key={`isActive-${initial?._id ?? 'new'}`}
            id="isActive"
            name="isActive"
            defaultChecked={initial?.isActive ?? true}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
      ) : null}
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? 'Saving…' : submitLabel}
      </Button>
    </form>
  );
}
