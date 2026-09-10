'use client';

import { EyeIcon, EyeOffIcon } from 'lucide-react';
import Link from 'next/link';
import { useActionState, useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WhatsappAccountsManager } from '@/components/whatsapp-accounts-manager';
import {
  testResendCredentials,
  updateSettingsAction,
  type EmailTestResult,
  type SettingsFormState,
} from '@/lib/actions/settings';
import type { WhatsappTestResult } from '@/lib/actions/whatsapp-accounts';
import type { DeliveryChannel, Job, Setting, WhatsappAccount } from '@/lib/types';

const initialState: SettingsFormState = {};
const NO_DEFAULT_JOB_VALUE = '__none__';
const CHANNEL_OPTIONS: { value: DeliveryChannel; label: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp only' },
  { value: 'email', label: 'Email only' },
  { value: 'both', label: 'WhatsApp + Email' },
];

export function SettingsForm({
  settings,
  jobs,
  whatsappAccounts,
  initialTestResults,
}: {
  settings: Setting;
  jobs: Job[];
  whatsappAccounts: WhatsappAccount[];
  initialTestResults: Record<string, WhatsappTestResult | null>;
}) {
  const [state, formAction, pending] = useActionState(updateSettingsAction, initialState);
  const [activeTab, setActiveTab] = useState('general');
  const [defaultJobId, setDefaultJobId] = useState(settings.defaultJobId);
  const [defaultDeliveryChannel, setDefaultDeliveryChannel] = useState<DeliveryChannel>(
    settings.defaultDeliveryChannel,
  );
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey);
  const [showResendKey, setShowResendKey] = useState(false);
  const [resendApiKey, setResendApiKey] = useState(settings.resendApiKey);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [resendWebhookSecret, setResendWebhookSecret] = useState(settings.resendWebhookSecret);
  const [emailFromAddress, setEmailFromAddress] = useState(settings.emailFromAddress);
  const [emailFromName, setEmailFromName] = useState(settings.emailFromName);
  const [defaultReplyTo, setDefaultReplyTo] = useState(settings.defaultReplyTo);
  const [testingResend, startTestingResend] = useTransition();
  const [resendTestResult, setResendTestResult] = useState<EmailTestResult | null>(null);

  useEffect(() => {
    if (state.success) {
      toast.success('Settings saved');
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  function handleTestResend() {
    startTestingResend(async () => {
      const result = await testResendCredentials(resendApiKey, emailFromAddress);
      setResendTestResult(result);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab((value as string) ?? 'general')}>
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
        </TabsList>

        <form action={formAction} className="flex flex-col gap-6">
          <TabsContent value="general">
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
                      Available as a &quot;Use default&quot; button next to the Interview Link field on the New
                      Interview form.
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
                    <p className="text-xs text-muted-foreground">
                      Pre-selected automatically on the New Interview form.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="defaultDeliveryChannel">Default Delivery Channel</Label>
                    <input type="hidden" name="defaultDeliveryChannel" value={defaultDeliveryChannel} />
                    <Select
                      value={defaultDeliveryChannel}
                      onValueChange={(value) => setDefaultDeliveryChannel((value as DeliveryChannel) ?? 'whatsapp')}
                    >
                      <SelectTrigger id="defaultDeliveryChannel" className="w-full">
                        <SelectValue>
                          {() => CHANNEL_OPTIONS.find((o) => o.value === defaultDeliveryChannel)?.label}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {CHANNEL_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Pre-selected on the New Interview form&apos;s delivery channel picker.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI Autofill</CardTitle>
                  <CardDescription>
                    Gemini API key used to autofill contact fields from a pasted or uploaded screenshot.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
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
            </div>
          </TabsContent>

          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>Follow-up Email</CardTitle>
                <CardDescription>
                  Sent via Resend when the delivery channel includes Email. Manage what the email actually says on the
                  Email Templates page.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="resendApiKey">Resend API Key</Label>
                    <div className="relative">
                      <Input
                        id="resendApiKey"
                        name="resendApiKey"
                        type={showResendKey ? 'text' : 'password'}
                        className="pr-9"
                        value={resendApiKey}
                        onChange={(e) => setResendApiKey(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowResendKey((v) => !v)}
                        className="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground hover:text-foreground"
                        aria-label={showResendKey ? 'Hide Resend API key' : 'Show Resend API key'}
                      >
                        {showResendKey ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="emailFromAddress">From Address</Label>
                    <Input
                      id="emailFromAddress"
                      name="emailFromAddress"
                      placeholder="noreply@hiring.narpaar.com"
                      value={emailFromAddress}
                      onChange={(e) => setEmailFromAddress(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="emailFromName">From Name</Label>
                    <Input
                      id="emailFromName"
                      name="emailFromName"
                      placeholder="Narpaar Hiring"
                      value={emailFromName}
                      onChange={(e) => setEmailFromName(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Shown as the sender name, e.g. &quot;{emailFromName || 'Narpaar Hiring'} &lt;
                      {emailFromAddress || 'noreply@hiring.narpaar.com'}&gt;&quot;.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="defaultReplyTo">Default Reply-To</Label>
                    <Input
                      id="defaultReplyTo"
                      name="defaultReplyTo"
                      placeholder="hr@hiring.narpaar.com"
                      value={defaultReplyTo}
                      onChange={(e) => setDefaultReplyTo(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Used unless a template sets its own Reply-To.</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="resendWebhookSecret">Webhook Signing Secret</Label>
                    <div className="relative">
                      <Input
                        id="resendWebhookSecret"
                        name="resendWebhookSecret"
                        type={showWebhookSecret ? 'text' : 'password'}
                        className="pr-9"
                        value={resendWebhookSecret}
                        onChange={(e) => setResendWebhookSecret(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowWebhookSecret((v) => !v)}
                        className="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground hover:text-foreground"
                        aria-label={showWebhookSecret ? 'Hide webhook secret' : 'Show webhook secret'}
                      >
                        {showWebhookSecret ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      In Resend, add a webhook to <code>your-backend-url/webhooks/resend</code> for the delivered,
                      opened, clicked, bounced and complained events, then paste its signing secret here to verify
                      requests. Leave blank to accept events unverified.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={handleTestResend}
                  disabled={testingResend}
                >
                  {testingResend ? 'Testing…' : 'Test Credentials'}
                </Button>

                {resendTestResult ? (
                  <div className="flex flex-col gap-2 rounded-none bg-muted/30 p-3 text-xs ring-1 ring-foreground/10">
                    <div className="flex items-center gap-2">
                      <Badge variant={resendTestResult.success ? 'default' : 'destructive'}>
                        {resendTestResult.success ? 'Connected' : 'Failed'}
                      </Badge>
                      <span className="text-muted-foreground">{resendTestResult.message}</span>
                    </div>
                    {resendTestResult.details ? (
                      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-muted-foreground">
                        {resendTestResult.details.fromDomain ? (
                          <>
                            <dt>From domain</dt>
                            <dd className="text-foreground">{resendTestResult.details.fromDomain}</dd>
                          </>
                        ) : null}
                        {resendTestResult.details.fromDomainStatus ? (
                          <>
                            <dt>Domain status</dt>
                            <dd className="text-foreground">{resendTestResult.details.fromDomainStatus}</dd>
                          </>
                        ) : null}
                      </dl>
                    ) : null}
                  </div>
                ) : null}

                <Button
                  render={<Link href="/email-templates" />}
                  nativeButton={false}
                  variant="outline"
                  size="sm"
                  className="w-fit"
                >
                  Manage Email Templates
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {activeTab !== 'whatsapp' ? (
            <Button type="submit" disabled={pending} className="w-fit">
              {pending ? 'Saving…' : 'Save'}
            </Button>
          ) : null}
        </form>

        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Accounts</CardTitle>
              <CardDescription>
                Each account can have its own approved templates. The account marked Active is used to send messages.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WhatsappAccountsManager accounts={whatsappAccounts} initialTestResults={initialTestResults} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
