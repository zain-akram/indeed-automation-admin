'use client';

import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { useActionState, useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  syncWhatsappTemplates,
  testWhatsappCredentials,
  updateSettingsAction,
  type SettingsFormState,
  type TemplateSyncResult,
  type WhatsappTestResult,
} from '@/lib/actions/settings';
import type { Job, Setting } from '@/lib/types';

const initialState: SettingsFormState = {};
const NO_DEFAULT_JOB_VALUE = '__none__';

function templateStatusVariant(status?: string): 'default' | 'secondary' | 'destructive' {
  if (status === 'APPROVED') return 'default';
  if (status === 'REJECTED') return 'destructive';
  return 'secondary';
}

export function SettingsForm({
  settings,
  jobs,
  initialConnectionStatus,
  initialTemplateSync,
}: {
  settings: Setting;
  jobs: Job[];
  initialConnectionStatus: WhatsappTestResult | null;
  initialTemplateSync: TemplateSyncResult | null;
}) {
  const [state, formAction, pending] = useActionState(updateSettingsAction, initialState);
  const [defaultJobId, setDefaultJobId] = useState(settings.defaultJobId);
  const [showToken, setShowToken] = useState(false);
  const [businessId, setBusinessId] = useState(settings.whatsappBusinessId);
  const [phoneNumberId, setPhoneNumberId] = useState(settings.whatsappPhoneNumberId);
  const [apiToken, setApiToken] = useState(settings.whatsappApiToken);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey);
  const [testResult, setTestResult] = useState<WhatsappTestResult | null>(initialConnectionStatus);
  const [testing, startTest] = useTransition();
  const [templateSync, setTemplateSync] = useState<TemplateSyncResult | null>(initialTemplateSync);
  const [syncing, startSync] = useTransition();

  useEffect(() => {
    if (state.success) {
      toast.success('Settings saved');
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  function handleTest() {
    startTest(async () => {
      const result = await testWhatsappCredentials(apiToken, phoneNumberId);
      setTestResult(result);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleSyncTemplates() {
    startSync(async () => {
      const result = await syncWhatsappTemplates();
      setTemplateSync(result);
      if (!result.success) {
        toast.error(result.message ?? 'Failed to sync templates');
      }
    });
  }

  return (
    <form action={formAction} className="flex max-w-4xl flex-col gap-6">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Interview Defaults</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="defaultInterviewLink">Default Interview Link</Label>
              <Input
                key={`link-${settings.defaultInterviewLink}`}
                id="defaultInterviewLink"
                name="defaultInterviewLink"
                placeholder="https://meet.example.com/your-room"
                defaultValue={settings.defaultInterviewLink}
              />
              <p className="text-xs text-muted-foreground">
                Available as a &quot;Use default&quot; button next to the Interview Link field on the New Interview
                form.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="defaultJobId">Default Job</Label>
              <input type="hidden" name="defaultJobId" value={defaultJobId} />
              <Select
                value={defaultJobId || NO_DEFAULT_JOB_VALUE}
                onValueChange={(value) => setDefaultJobId(value === NO_DEFAULT_JOB_VALUE ? '' : (value ?? ''))}
              >
                <SelectTrigger id="defaultJobId" className="w-full">
                  <SelectValue placeholder="None">
                    {() => jobs.find((j) => j._id === defaultJobId)?.title ?? 'None'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_DEFAULT_JOB_VALUE}>None</SelectItem>
                  {jobs.map((job) => (
                    <SelectItem key={job._id} value={job._id}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Pre-selected automatically on the New Interview form.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>WhatsApp Cloud API</CardTitle>
            <CardDescription>
              Credentials used to send messages. Stored in the database, editable here — no redeploy needed.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="whatsappBusinessId">WhatsApp Business ID</Label>
              <Input
                id="whatsappBusinessId"
                name="whatsappBusinessId"
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="whatsappPhoneNumberId">Phone Number ID</Label>
              <Input
                id="whatsappPhoneNumberId"
                name="whatsappPhoneNumberId"
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="whatsappApiToken">Access Token</Label>
              <div className="relative">
                <Input
                  id="whatsappApiToken"
                  name="whatsappApiToken"
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

            <Button type="button" variant="outline" onClick={handleTest} disabled={testing} className="w-fit">
              {testing ? 'Testing…' : 'Test Credentials'}
            </Button>

            {testResult ? (
              <div className="flex flex-col gap-2 rounded-none bg-muted/30 p-3 text-xs ring-1 ring-foreground/10">
                <div className="flex items-center gap-2">
                  <Badge variant={testResult.success ? 'default' : 'destructive'}>
                    {testResult.success ? 'Connected' : 'Failed'}
                  </Badge>
                  <span className="text-muted-foreground">{testResult.message}</span>
                </div>
                {testResult.details ? (
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-muted-foreground">
                    {testResult.details.verifiedName ? (
                      <>
                        <dt>Verified name</dt>
                        <dd className="text-foreground">{testResult.details.verifiedName}</dd>
                      </>
                    ) : null}
                    {testResult.details.displayPhoneNumber ? (
                      <>
                        <dt>Phone number</dt>
                        <dd className="text-foreground">{testResult.details.displayPhoneNumber}</dd>
                      </>
                    ) : null}
                    {testResult.details.status ? (
                      <>
                        <dt>Status</dt>
                        <dd className="text-foreground">{testResult.details.status}</dd>
                      </>
                    ) : null}
                    {testResult.details.qualityRating ? (
                      <>
                        <dt>Quality rating</dt>
                        <dd className="text-foreground">{testResult.details.qualityRating}</dd>
                      </>
                    ) : null}
                    {testResult.details.codeVerificationStatus ? (
                      <>
                        <dt>Code verification</dt>
                        <dd className="text-foreground">{testResult.details.codeVerificationStatus}</dd>
                      </>
                    ) : null}
                    {testResult.details.messagingLimitCap ? (
                      <>
                        <dt>Messaging limit</dt>
                        <dd className="text-foreground">
                          {testResult.details.messagingLimitCap} / 24h ({testResult.details.messagingLimitTier})
                        </dd>
                      </>
                    ) : null}
                  </dl>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Autofill</CardTitle>
          <CardDescription>
            Gemini API key used to autofill contact fields from a pasted or uploaded screenshot.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex max-w-md flex-col gap-2">
            <Label htmlFor="geminiApiKey">Gemini API Key</Label>
            <div className="relative">
              <Input
                id="geminiApiKey"
                name="geminiApiKey"
                type={showGeminiKey ? 'text' : 'password'}
                className="pr-9"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowGeminiKey((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground hover:text-foreground"
                aria-label={showGeminiKey ? 'Hide Gemini API key' : 'Show Gemini API key'}
              >
                {showGeminiKey ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Message Templates</CardTitle>
          <CardDescription>Approval status of each configured template, checked against Meta.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button type="button" variant="outline" onClick={handleSyncTemplates} disabled={syncing} className="w-fit">
            {syncing ? 'Syncing…' : 'Sync Templates'}
          </Button>

          {templateSync && !templateSync.success ? (
            <p className="text-xs text-destructive">{templateSync.message}</p>
          ) : null}

          {templateSync?.templates ? (
            <div className="flex flex-col gap-2">
              {templateSync.templates.map((t) => (
                <div
                  key={t.key}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-none bg-muted/30 p-3 text-xs ring-1 ring-foreground/10"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-foreground">{t.label}</span>
                    <span className="text-muted-foreground">
                      key: {t.key} · language: {t.configuredLanguage}
                      {t.languageMismatch ? (
                        <span className="text-destructive"> (Meta has &quot;{t.metaLanguage}&quot;)</span>
                      ) : null}
                    </span>
                  </div>
                  <Badge variant={t.found ? templateStatusVariant(t.metaStatus) : 'destructive'}>
                    {t.found ? (t.metaStatus ?? 'UNKNOWN') : 'NOT FOUND'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? 'Saving…' : 'Save'}
      </Button>
    </form>
  );
}
