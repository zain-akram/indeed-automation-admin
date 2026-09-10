'use client';

import { EyeIcon, EyeOffIcon, PlusIcon } from 'lucide-react';
import { useState, useTransition } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WhatsappIcon } from '@/components/whatsapp-icon';
import {
  activateWhatsappAccountAction,
  createWhatsappAccountAction,
  deleteWhatsappAccountAction,
  syncWhatsappAccountTemplates,
  testWhatsappAccountById,
  testWhatsappAccountCredentials,
  updateWhatsappAccountAction,
  type TemplateSyncResult,
  type WhatsappTestResult,
} from '@/lib/actions/whatsapp-accounts';
import type { TemplateDef, WhatsappAccount } from '@/lib/types';

const NO_DEFAULT_TEMPLATE_VALUE = '__none__';

function templateStatusVariant(status?: string): 'default' | 'secondary' | 'destructive' {
  if (status === 'APPROVED') return 'default';
  if (status === 'REJECTED') return 'destructive';
  return 'secondary';
}

function TemplateListPanel({ templates, errorMessage }: { templates: TemplateDef[]; errorMessage?: string }) {
  if (errorMessage) {
    return <p className="text-xs text-destructive">{errorMessage}</p>;
  }
  if (templates.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No templates synced yet. Click &quot;Sync Templates&quot; to fetch the real, approved templates from this
        WhatsApp Business Account.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {templates.map((t) => (
        <div
          key={`${t.key}-${t.language}`}
          className="flex flex-wrap items-center justify-between gap-2 rounded-none bg-muted/30 p-3 text-xs ring-1 ring-foreground/10"
        >
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-foreground">{t.label}</span>
            <span className="text-muted-foreground">
              language: {t.language}
              {t.category ? ` · category: ${t.category}` : ''}
            </span>
            {t.body ? <span className="mt-1 whitespace-pre-wrap text-foreground">{t.body}</span> : null}
          </div>
          {t.status ? <Badge variant={templateStatusVariant(t.status)}>{t.status}</Badge> : null}
        </div>
      ))}
    </div>
  );
}

function TestResultPanel({ result }: { result: WhatsappTestResult | null }) {
  if (!result) {
    return null;
  }
  return (
    <div className="flex flex-col gap-2 rounded-none bg-muted/30 p-3 text-xs ring-1 ring-foreground/10">
      <div className="flex items-center gap-2">
        <Badge variant={result.success ? 'default' : 'destructive'}>{result.success ? 'Connected' : 'Failed'}</Badge>
        <span className="text-muted-foreground">{result.message}</span>
      </div>
      {result.details ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-muted-foreground">
          {result.details.verifiedName ? (
            <>
              <dt>Verified name</dt>
              <dd className="text-foreground">{result.details.verifiedName}</dd>
            </>
          ) : null}
          {result.details.displayPhoneNumber ? (
            <>
              <dt>Phone number</dt>
              <dd className="text-foreground">{result.details.displayPhoneNumber}</dd>
            </>
          ) : null}
          {result.details.status ? (
            <>
              <dt>Status</dt>
              <dd className="text-foreground">{result.details.status}</dd>
            </>
          ) : null}
          {result.details.qualityRating ? (
            <>
              <dt>Quality rating</dt>
              <dd className="text-foreground">{result.details.qualityRating}</dd>
            </>
          ) : null}
          {result.details.codeVerificationStatus ? (
            <>
              <dt>Code verification</dt>
              <dd className="text-foreground">{result.details.codeVerificationStatus}</dd>
            </>
          ) : null}
          {result.details.messagingLimitCap ? (
            <>
              <dt>Messaging limit</dt>
              <dd className="text-foreground">
                {result.details.messagingLimitCap} / 24h ({result.details.messagingLimitTier})
              </dd>
            </>
          ) : null}
        </dl>
      ) : null}
    </div>
  );
}

function CredentialFields({
  label,
  setLabel,
  businessId,
  setBusinessId,
  phoneNumberId,
  setPhoneNumberId,
  apiToken,
  setApiToken,
}: {
  label: string;
  setLabel: (v: string) => void;
  businessId: string;
  setBusinessId: (v: string) => void;
  phoneNumberId: string;
  setPhoneNumberId: (v: string) => void;
  apiToken: string;
  setApiToken: (v: string) => void;
}) {
  const [showToken, setShowToken] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label>Label</Label>
        <Input placeholder="e.g. Business A" value={label} onChange={(e) => setLabel(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label>WhatsApp Business ID</Label>
        <Input value={businessId} onChange={(e) => setBusinessId(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Phone Number ID</Label>
        <Input value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Access Token</Label>
        <div className="relative">
          <Input
            type={showToken ? 'text' : 'password'}
            className="pr-9"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowToken((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground hover:text-foreground"
            aria-label={showToken ? 'Hide access token' : 'Show access token'}
          >
            {showToken ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function WhatsappAccountDetails({
  account,
  initialTestResult,
  onClose,
}: {
  account: WhatsappAccount;
  initialTestResult: WhatsappTestResult | null;
  onClose: () => void;
}) {
  const [label, setLabel] = useState(account.label);
  const [businessId, setBusinessId] = useState(account.whatsappBusinessId);
  const [phoneNumberId, setPhoneNumberId] = useState(account.whatsappPhoneNumberId);
  const [apiToken, setApiToken] = useState(account.whatsappApiToken);
  const [defaultTemplateKey, setDefaultTemplateKey] = useState(account.defaultTemplateKey ?? '');
  const [dirty, setDirty] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, startSaving] = useTransition();
  const [activating, startActivating] = useTransition();
  const [deleting, startDeleting] = useTransition();
  const [testing, startTest] = useTransition();
  const [syncing, startSync] = useTransition();
  const [testResult, setTestResult] = useState<WhatsappTestResult | null>(initialTestResult);
  const [templateSync, setTemplateSync] = useState<TemplateSyncResult | null>(null);

  function markDirty<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setDirty(true);
    };
  }

  function handleSave() {
    if (!label.trim() || !businessId.trim() || !phoneNumberId.trim() || !apiToken.trim()) {
      toast.error('All fields are required');
      return;
    }
    startSaving(async () => {
      const result = await updateWhatsappAccountAction(account._id, {
        label: label.trim(),
        whatsappBusinessId: businessId.trim(),
        whatsappPhoneNumberId: phoneNumberId.trim(),
        whatsappApiToken: apiToken.trim(),
        defaultTemplateKey,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Account updated');
        setDirty(false);
      }
    });
  }

  function handleActivate() {
    startActivating(async () => {
      await activateWhatsappAccountAction(account._id);
      toast.success(`"${account.label}" is now the active WhatsApp account`);
    });
  }

  function handleDelete() {
    startDeleting(async () => {
      await deleteWhatsappAccountAction(account._id);
      toast.success('Account removed');
      onClose();
    });
  }

  function handleTest() {
    startTest(async () => {
      const result = dirty
        ? await testWhatsappAccountCredentials(apiToken, phoneNumberId)
        : await testWhatsappAccountById(account._id);
      setTestResult(result);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleSync() {
    startSync(async () => {
      const result = await syncWhatsappAccountTemplates(account._id);
      setTemplateSync(result);
      if (!result.success) {
        toast.error(result.message ?? 'Failed to sync templates');
      }
    });
  }

  // Prefer a just-synced live result; otherwise fall back to the templates cached on this
  // account from the last sync (real name, body, status and category from the WhatsApp API).
  const availableTemplates = templateSync?.success ? (templateSync.templates ?? []) : (account.templates ?? []);
  const syncErrorMessage = templateSync && !templateSync.success ? templateSync.message : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {account.isActive ? (
          <Badge>Active</Badge>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={handleActivate} disabled={activating}>
            {activating ? 'Activating…' : 'Set Active'}
          </Button>
        )}
      </div>

      <CredentialFields
        label={label}
        setLabel={markDirty(setLabel)}
        businessId={businessId}
        setBusinessId={markDirty(setBusinessId)}
        phoneNumberId={phoneNumberId}
        setPhoneNumberId={markDirty(setPhoneNumberId)}
        apiToken={apiToken}
        setApiToken={markDirty(setApiToken)}
      />

      <div className="flex flex-col gap-2">
        <Label>Default Template</Label>
        <Select
          value={defaultTemplateKey || NO_DEFAULT_TEMPLATE_VALUE}
          onValueChange={(value) =>
            markDirty(setDefaultTemplateKey)(value === NO_DEFAULT_TEMPLATE_VALUE ? '' : (value ?? ''))
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="None">
              {() => availableTemplates.find((t) => t.key === defaultTemplateKey)?.label ?? 'None'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_DEFAULT_TEMPLATE_VALUE}>None</SelectItem>
            {availableTemplates.map((template) => (
              <SelectItem key={template.key} value={template.key}>
                {template.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {availableTemplates.length > 0
            ? 'Only templates synced from this account are shown. Pre-selected on the New Interview form when this is active.'
            : 'Sync Templates to see which ones are available on this account.'}
        </p>
      </div>

      {dirty ? (
        <Button type="button" onClick={handleSave} disabled={saving} className="w-fit">
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleTest} disabled={testing}>
          {testing ? 'Testing…' : 'Test Credentials'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
          {syncing ? 'Syncing…' : 'Sync Templates'}
        </Button>
      </div>

      <TestResultPanel result={testResult} />
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>Available Templates</Label>
          {account.templatesSyncedAt && !templateSync ? (
            <span className="text-xs text-muted-foreground">
              Synced {new Date(account.templatesSyncedAt).toLocaleString()}
            </span>
          ) : null}
        </div>
        <TemplateListPanel templates={availableTemplates} errorMessage={syncErrorMessage} />
      </div>

      <div className="flex justify-end border-t border-foreground/10 pt-4">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => setConfirmDelete(true)}
          disabled={deleting}
        >
          {deleting ? 'Removing…' : 'Delete Account'}
        </Button>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{account.label}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the account permanently. If it&apos;s the active account, another one will be activated
              automatically if any remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function WhatsappAccountListItem({
  account,
  initialTestResult,
}: {
  account: WhatsappAccount;
  initialTestResult: WhatsappTestResult | null;
}) {
  const [open, setOpen] = useState(false);
  const [activating, startActivating] = useTransition();

  function handleActivate() {
    startActivating(async () => {
      await activateWhatsappAccountAction(account._id);
      toast.success(`"${account.label}" is now the active WhatsApp account`);
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-none bg-muted/20 p-3 ring-1 ring-foreground/10">
      <div className="flex items-center gap-2">
        <WhatsappIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className="font-medium">{account.label}</span>
        {account.isActive ? <Badge>Active</Badge> : null}
        <span className="text-xs text-muted-foreground">{account.displayPhoneNumber ?? 'Not tested yet'}</span>
      </div>
      <div className="flex items-center gap-2">
        {!account.isActive ? (
          <Button type="button" variant="ghost" size="sm" onClick={handleActivate} disabled={activating}>
            {activating ? 'Activating…' : 'Set Active'}
          </Button>
        ) : null}
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          Settings
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <WhatsappIcon className="size-4 shrink-0 text-muted-foreground" />
              {account.label}
            </DialogTitle>
          </DialogHeader>
          <WhatsappAccountDetails
            account={account}
            initialTestResult={initialTestResult}
            onClose={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AddAccountDialog() {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [pending, startTransition] = useTransition();

  function reset() {
    setLabel('');
    setBusinessId('');
    setPhoneNumberId('');
    setApiToken('');
  }

  function handleCreate() {
    if (!label.trim() || !businessId.trim() || !phoneNumberId.trim() || !apiToken.trim()) {
      toast.error('All fields are required');
      return;
    }
    const formData = new FormData();
    formData.set('label', label.trim());
    formData.set('whatsappBusinessId', businessId.trim());
    formData.set('whatsappPhoneNumberId', phoneNumberId.trim());
    formData.set('whatsappApiToken', apiToken.trim());
    startTransition(async () => {
      const result = await createWhatsappAccountAction({}, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('WhatsApp account added');
        reset();
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="outline" onClick={() => setOpen(true)} className="w-fit">
        <PlusIcon className="size-4" />
        Add WhatsApp Account
      </Button>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New WhatsApp Account</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <CredentialFields
            label={label}
            setLabel={setLabel}
            businessId={businessId}
            setBusinessId={setBusinessId}
            phoneNumberId={phoneNumberId}
            setPhoneNumberId={setPhoneNumberId}
            apiToken={apiToken}
            setApiToken={setApiToken}
          />
          <Button type="button" onClick={handleCreate} disabled={pending} className="w-fit">
            {pending ? 'Adding…' : 'Add Account'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function WhatsappAccountsManager({
  accounts,
  initialTestResults,
}: {
  accounts: WhatsappAccount[];
  initialTestResults: Record<string, WhatsappTestResult | null>;
}) {
  const sortedAccounts = [...accounts].sort((a, b) => Number(b.isActive) - Number(a.isActive));

  return (
    <div className="flex flex-col gap-3">
      {sortedAccounts.map((account) => (
        <WhatsappAccountListItem
          key={account._id}
          account={account}
          initialTestResult={initialTestResults[account._id] ?? null}
        />
      ))}

      {accounts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No WhatsApp accounts configured yet.</p>
      ) : null}

      <AddAccountDialog />
    </div>
  );
}
