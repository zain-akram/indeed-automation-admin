import { ArrowRightIcon, BriefcaseIcon, CalendarPlusIcon, UserPlusIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getContacts } from '@/lib/actions/contacts';
import { getJobs } from '@/lib/actions/jobs';
import { getSettings, testWhatsappCredentials } from '@/lib/actions/settings';
import { getSubmissions, getUsageLast24Hours } from '@/lib/actions/submissions';

const QUICK_ACTIONS = [
  { href: '/interviews/new', label: 'New Interview', icon: CalendarPlusIcon },
  { href: '/contacts/new', label: 'Add Contact', icon: UserPlusIcon },
  { href: '/jobs/new', label: 'Add Job', icon: BriefcaseIcon },
];

export default async function DashboardPage() {
  const [jobs, contacts, submissions, settings, usage] = await Promise.all([
    getJobs(),
    getContacts(),
    getSubmissions(),
    getSettings(),
    getUsageLast24Hours(),
  ]);

  const connectionStatus =
    settings.whatsappApiToken && settings.whatsappPhoneNumberId
      ? await testWhatsappCredentials(settings.whatsappApiToken, settings.whatsappPhoneNumberId)
      : null;

  const messagingLimitCap = connectionStatus?.details?.messagingLimitCap ?? null;
  const messagingLimitTier = connectionStatus?.details?.messagingLimitTier;
  const used = usage.conversationsUsed;
  const left = messagingLimitCap !== null ? Math.max(messagingLimitCap - used, 0) : null;
  const usedPercent = messagingLimitCap ? Math.min((used / messagingLimitCap) * 100, 100) : 0;

  const stats = [
    { label: 'Total Jobs', count: jobs.length, href: '/jobs' },
    { label: 'Total Contacts', count: contacts.length, href: '/contacts' },
    { label: 'Total Interviews', count: submissions.length, href: '/interviews' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((action) => (
          <Button key={action.href} render={<Link href={action.href} />} nativeButton={false} variant="outline">
            <action.icon className="size-4" />
            {action.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.href} href={stat.href} className="block">
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <p className="text-3xl font-semibold">{stat.count}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  View all <ArrowRightIcon className="size-3" />
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Messaging Limit</CardTitle>
          <CardDescription>Business-initiated conversations in a rolling 24-hour period</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {messagingLimitCap === null ? (
            <p className="text-sm text-muted-foreground">
              {connectionStatus?.success === false
                ? connectionStatus.message
                : 'Configure WhatsApp credentials in Settings to see this.'}
            </p>
          ) : (
            <>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-semibold">{messagingLimitCap}</span>
                <span className="text-xs text-muted-foreground">{messagingLimitTier}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-none bg-muted">
                <div className="h-full bg-primary" style={{ width: `${usedPercent}%` }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Sent (24h): {used}</span>
                <span>Left: {left}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
