'use client';

import { CopyIcon, PlusIcon } from 'lucide-react';
import { useActionState, useState, useTransition } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  createOrganizationAction,
  deleteOrganizationAction,
  rotateOrganizationSecretAction,
  setOrganizationActiveAction,
  type Organization,
  type OrganizationActionState,
} from '@/lib/actions/organizations';

function SecretRevealDialog({ secret, onClose }: { secret: string | null; onClose: () => void }) {
  function copy() {
    navigator.clipboard.writeText(secret ?? '');
    toast.success('Secret copied to clipboard');
  }

  return (
    <Dialog open={secret !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Organization secret</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This is shown once — copy it now. Use it to sign in as this organization from the admin login page.
        </p>
        <div className="flex items-center gap-2 rounded-none bg-muted/30 p-3 ring-1 ring-foreground/10">
          <code className="flex-1 overflow-x-auto text-xs break-all">{secret}</code>
          <Button type="button" variant="ghost" size="icon-sm" onClick={copy} aria-label="Copy secret">
            <CopyIcon className="size-3.5" />
          </Button>
        </div>
        <DialogFooter>
          <Button type="button" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const initialState: OrganizationActionState = {};

function CreateOrganizationDialog({ onSecret }: { onSecret: (secret: string) => void }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createOrganizationAction, initialState);

  async function handleSubmit(formData: FormData) {
    const result = await formAction(formData);
    return result;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next && state.secret) {
          onSecret(state.secret);
        }
      }}
    >
      <Button type="button" variant="outline" onClick={() => setOpen(true)} className="w-fit">
        <PlusIcon className="size-4" />
        New Organization
      </Button>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New Organization</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
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
      </DialogContent>
    </Dialog>
  );
}

function OrganizationRow({
  organization,
  onSecret,
}: {
  organization: Organization;
  onSecret: (secret: string) => void;
}) {
  const [rotating, startRotate] = useTransition();
  const [toggling, startToggle] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleRotate() {
    startRotate(async () => {
      const result = await rotateOrganizationSecretAction(organization._id);
      if (result.error) {
        toast.error(result.error);
      } else if (result.secret) {
        onSecret(result.secret);
      }
    });
  }

  function handleToggle(next: boolean) {
    startToggle(async () => {
      await setOrganizationActiveAction(organization._id, next);
      toast.success(next ? `"${organization.name}" activated` : `"${organization.name}" deactivated`);
    });
  }

  function handleDelete() {
    startDelete(async () => {
      const result = await deleteOrganizationAction(organization._id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Organization deleted');
      }
    });
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{organization.name}</TableCell>
      <TableCell className="text-muted-foreground">{organization.slug}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Switch checked={organization.isActive} onCheckedChange={handleToggle} disabled={toggling} />
          {organization.isActive ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {new Date(organization.createdAt).toLocaleDateString('en-US')}
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleRotate} disabled={rotating}>
            {rotating ? 'Rotating…' : 'Rotate Secret'}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setConfirmDelete(true)}
            disabled={deleting}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete &quot;{organization.name}&quot;?</AlertDialogTitle>
              <AlertDialogDescription>
                This only succeeds if the organization has no jobs, contacts, submissions, email templates, or WhatsApp
                accounts left. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
}

export function OrganizationsTable({ organizations }: { organizations: Organization[] }) {
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <CreateOrganizationDialog onSecret={setRevealedSecret} />

      {organizations.length === 0 ? (
        <p className="text-sm text-muted-foreground">No organizations yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.map((organization) => (
              <OrganizationRow key={organization._id} organization={organization} onSecret={setRevealedSecret} />
            ))}
          </TableBody>
        </Table>
      )}

      <SecretRevealDialog secret={revealedSecret} onClose={() => setRevealedSecret(null)} />
    </div>
  );
}
