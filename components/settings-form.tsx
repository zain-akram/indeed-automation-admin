'use client';

import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WhatsappAccountsManager } from '@/components/whatsapp-accounts-manager';
import { updateSettingsAction, type SettingsFormState } from '@/lib/actions/settings';
import type { WhatsappTestResult } from '@/lib/actions/whatsapp-accounts';
import type { Job, Setting, WhatsappAccount } from '@/lib/types';

const initialState: SettingsFormState = {};
const NO_DEFAULT_JOB_VALUE = '__none__';

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
  const [defaultJobId, setDefaultJobId] = useState(settings.defaultJobId);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey);

  useEffect(() => {
    if (state.success) {
      toast.success('Settings saved');
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-6">
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

        <Button type="submit" disabled={pending} className="w-fit">
          {pending ? 'Saving…' : 'Save'}
        </Button>
      </form>

      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-medium">WhatsApp Accounts</h2>
          <p className="text-xs text-muted-foreground">
            Each account can have its own approved templates. The account marked Active is used to send messages.
          </p>
        </div>
        <WhatsappAccountsManager accounts={whatsappAccounts} initialTestResults={initialTestResults} />
      </div>
    </div>
  );
}
