'use client';

import { Building2Icon, PlusIcon } from 'lucide-react';
import { useActionState, useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  switchOrganization,
  unlockOrganization,
  type UnlockOrganizationState,
} from '@/lib/actions/organizations-session';

const ADD_ORGANIZATION_VALUE = '__add__';

interface OrgOption {
  organizationId: string;
  name: string;
}

const initialState: UnlockOrganizationState = {};

function AddOrganizationDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [state, formAction, pending] = useActionState(unlockOrganization, initialState);

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Organization</DialogTitle>
        </DialogHeader>
        <form
          action={async (formData) => {
            await formAction(formData);
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="org-secret">Organization secret</Label>
            <Input id="org-secret" name="secret" type="password" required autoFocus />
          </div>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="ghost" />}>Cancel</DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? 'Adding…' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
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
      <AddOrganizationDialog open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}
