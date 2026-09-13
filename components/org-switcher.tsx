'use client';

import { Building2Icon, CopyIcon, PlusIcon } from 'lucide-react';
import { useActionState, useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createOrganizationAction, type OrganizationActionState } from '@/lib/actions/organizations';
import { switchOrganization } from '@/lib/actions/organizations-session';

const ADD_ORGANIZATION_VALUE = '__add__';

interface OrgOption {
  organizationId: string;
  name: string;
}

const initialState: OrganizationActionState = {};

function AddOrganizationDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [state, formAction, pending] = useActionState(createOrganizationAction, initialState);

  // Switch to the new org the moment it's created — the secret below is just shown for reference
  // (e.g. logging in as this org directly elsewhere later), not something you need to act on now.
  useEffect(() => {
    if (state.organizationId) {
      void switchOrganization(state.organizationId);
    }
  }, [state.organizationId]);

  function copySecret() {
    navigator.clipboard.writeText(state.secret ?? '');
    toast.success('Secret copied to clipboard');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{state.secret ? 'Organization created' : 'Add Organization'}</DialogTitle>
        </DialogHeader>
        {state.secret ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              This is shown once — copy it now if you&apos;ll need to log in as this organization directly later.
            </p>
            <div className="flex items-center gap-2 rounded-none bg-muted/30 p-3 ring-1 ring-foreground/10">
              <code className="flex-1 overflow-x-auto text-xs break-all">{state.secret}</code>
              <Button type="button" variant="ghost" size="icon-sm" onClick={copySecret} aria-label="Copy secret">
                <CopyIcon className="size-3.5" />
              </Button>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="org-name">Name</Label>
              <Input id="org-name" name="name" required autoFocus />
            </div>
            {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="ghost" />}>Cancel</DialogClose>
              <Button type="submit" disabled={pending}>
                {pending ? 'Creating…' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function OrgSwitcher({ orgs, activeOrganizationId }: { orgs: OrgOption[]; activeOrganizationId: string }) {
  const [addOpen, setAddOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const active = orgs.find((org) => org.organizationId === activeOrganizationId);

  function handleChange(value: string | null) {
    if (!value || value === activeOrganizationId) {
      return;
    }
    if (value === ADD_ORGANIZATION_VALUE) {
      setAddOpen(true);
      return;
    }
    startTransition(async () => {
      await switchOrganization(value);
    });
  }

  return (
    <>
      <Select value={activeOrganizationId} onValueChange={handleChange} disabled={pending}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Select organization">
            {() => (
              <span className="flex min-w-0 items-center gap-1.5">
                <Building2Icon className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{active?.name ?? 'Select organization'}</span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {orgs.map((org) => (
            <SelectItem key={org.organizationId} value={org.organizationId}>
              {org.name}
            </SelectItem>
          ))}
          <SelectItem value={ADD_ORGANIZATION_VALUE}>
            <PlusIcon className="size-3.5 shrink-0" />
            Add organization
          </SelectItem>
        </SelectContent>
      </Select>
      {/* Conditionally mounted so its create-form state resets fresh each time it's reopened. */}
      {addOpen ? <AddOrganizationDialog open={addOpen} onOpenChange={setAddOpen} /> : null}
    </>
  );
}
