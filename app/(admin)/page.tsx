import {
  ArrowRightIcon,
  BriefcaseIcon,
  CalendarPlusIcon,
  ClipboardListIcon,
  MailCheckIcon,
  MailIcon,
  MailOpenIcon,
  MousePointerClickIcon,
  SendIcon,
  UserPlusIcon,
  UsersIcon,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IndeedImportDialog } from '@/components/indeed-import-dialog';
import { StatsRangeSwitcher } from '@/components/stats-range-switcher';
import { WhatsappIcon } from '@/components/whatsapp-icon';
import { getContactsPage } from '@/lib/actions/contacts';
import { getJobs } from '@/lib/actions/jobs';
import { getEmailStats, getEmailUsage, getStatsByAccount, getSubmissionsCount } from '@/lib/actions/submissions';
import { getWhatsappAccounts } from '@/lib/actions/whatsapp-accounts';
import { DEFAULT_STATS_RANGE, isStatsRangeValue, rangeToSince } from '@/lib/stats-range';

const QUICK_ACTIONS = [
  { href: '/interviews/new', label: 'New Interview', icon: CalendarPlusIcon },
  { href: '/contacts/new', label: 'Add Contact', icon: UserPlusIcon },
  { href: '/jobs/new', label: 'Add Job', icon: BriefcaseIcon },
];

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range: rangeParam } = await searchParams;
  const range = rangeParam && isStatsRangeValue(rangeParam) ? rangeParam : DEFAULT_STATS_RANGE;
  const since = rangeToSince(range);

  const [jobs, contactsPage, submissionsCount, whatsappAccounts, statsByAccount, emailStats, emailUsage] =
    await Promise.all([
      getJobs(),
      getContactsPage({ limit: 1 }),
      getSubmissionsCount(since),
      getWhatsappAccounts(),
      getStatsByAccount(),
      getEmailStats(since),
      getEmailUsage(),
    ]);

  const inventoryStats = [
    { label: 'Total Jobs', count: jobs.length, href: '/jobs', icon: BriefcaseIcon },
    { label: 'Total Contacts', count: contactsPage.total, href: '/contacts', icon: UsersIcon },
  ];

  const activityStats = [
    { label: 'Submissions', count: submissionsCount, icon: ClipboardListIcon, href: '/interviews' },
    { label: 'Sent', count: emailStats.overall.sent, icon: SendIcon, href: '/emails' },
    { label: 'Delivered', count: emailStats.overall.delivered, icon: MailCheckIcon },
    { label: 'Opened', count: emailStats.overall.opened, icon: MailOpenIcon },
    { label: 'Clicked', count: emailStats.overall.clicked, icon: MousePointerClickIcon },
  ];

  const whatsappCap = whatsappAccounts.reduce((sum, a) => sum + (a.messagingLimitCap ?? 0), 0);
  const whatsappUsed24h = whatsappAccounts.reduce(
    (sum, a) => sum + (statsByAccount[a._id]?.conversationsUsed24h ?? 0),
    0,
  );
  const whatsappLeft = Math.max(whatsappCap - whatsappUsed24h, 0);
  const whatsappUsedPercent = whatsappCap ? Math.min((whatsappUsed24h / whatsappCap) * 100, 100) : 0;

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
        <IndeedImportDialog />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {inventoryStats.map((stat) => (
          <Link key={stat.href} href={stat.href} className="block">
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <stat.icon className="size-4" />
                  {stat.label}
                </CardTitle>
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

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">Activity</h2>
          <StatsRangeSwitcher value={range} />
        </div>
        {activityStats.every((stat) => stat.count === 0) ? (
          <p className="text-sm text-muted-foreground">No activity in this period.</p>
        ) : (
          <Card>
            <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              {activityStats.map((item) => {
                const content = (
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <item.icon className="size-3.5" />
                      {item.label}
                    </span>
                    <span className="text-2xl font-semibold">{item.count}</span>
                  </div>
                );
                return item.href ? (
                  <Link key={item.label} href={item.href} className="rounded-none transition-colors hover:bg-muted/50">
                    {content}
                  </Link>
                ) : (
                  <div key={item.label}>{content}</div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Messaging Accounts</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <MailIcon className="size-4 text-muted-foreground" />
                Email (Resend)
              </CardTitle>
              <CardDescription>Emails sent via Resend</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-between text-xs text-muted-foreground">
              <span>
                Today: <span className="font-medium text-foreground">{emailUsage.sentToday}</span>
              </span>
              <span>
                This month: <span className="font-medium text-foreground">{emailUsage.sentThisMonth}</span>
              </span>
            </CardContent>
          </Card>
          {whatsappAccounts.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <WhatsappIcon className="size-4 text-muted-foreground" />
                  WhatsApp
                </CardTitle>
                <CardDescription>
                  Shared across {whatsappAccounts.length} account{whatsappAccounts.length === 1 ? '' : 's'} — one
                  rolling 24h limit
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Total interviews sent</span>
                  <span className="font-medium text-foreground">
                    {whatsappAccounts.reduce((sum, a) => sum + (statsByAccount[a._id]?.totalSubmissions ?? 0), 0)}
                  </span>
                </div>
                {whatsappCap === 0 ? (
                  <p className="text-xs text-muted-foreground">Test credentials to see the messaging limit.</p>
                ) : (
                  <>
                    <div className="h-2 w-full overflow-hidden rounded-none bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${whatsappUsedPercent}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Sent (24h): {whatsappUsed24h}</span>
                      <span>
                        Left: {whatsappLeft} / {whatsappCap}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground">No WhatsApp accounts configured yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
