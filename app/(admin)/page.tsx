import { ArrowRightIcon, BriefcaseIcon, CalendarPlusIcon, UserPlusIcon } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getContacts } from '@/lib/actions/contacts';
import { getJobs } from '@/lib/actions/jobs';
import { getStatsByAccount, getSubmissions } from '@/lib/actions/submissions';
import { getWhatsappAccounts } from '@/lib/actions/whatsapp-accounts';

const QUICK_ACTIONS = [
  { href: '/interviews/new', label: 'New Interview', icon: CalendarPlusIcon },
  { href: '/contacts/new', label: 'Add Contact', icon: UserPlusIcon },
  { href: '/jobs/new', label: 'Add Job', icon: BriefcaseIcon },
];

export default async function DashboardPage() {
  const [jobs, contacts, submissions, whatsappAccounts, statsByAccount] = await Promise.all([
    getJobs(),
    getContacts(),
    getSubmissions(),
    getWhatsappAccounts(),
    getStatsByAccount(),
  ]);

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

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">WhatsApp Accounts</h2>
        {whatsappAccounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No WhatsApp accounts configured yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {whatsappAccounts.map((account) => {
              const stats = statsByAccount[account._id];
              const cap = account.messagingLimitCap ?? null;
              const used24h = stats?.conversationsUsed24h ?? 0;
              const left = cap !== null ? Math.max(cap - used24h, 0) : null;
              const usedPercent = cap ? Math.min((used24h / cap) * 100, 100) : 0;

              return (
                <Card key={account._id}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm font-medium">{account.label}</CardTitle>
                      {account.isActive ? <Badge>Active</Badge> : null}
                    </div>
                    <CardDescription>{account.displayPhoneNumber ?? 'Not tested yet'}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Total interviews sent</span>
                      <span className="font-medium text-foreground">{stats?.totalSubmissions ?? 0}</span>
                    </div>
                    {cap === null ? (
                      <p className="text-xs text-muted-foreground">Test credentials to see the messaging limit.</p>
                    ) : (
                      <>
                        <div className="h-2 w-full overflow-hidden rounded-none bg-muted">
                          <div className="h-full bg-primary" style={{ width: `${usedPercent}%` }} />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Sent (24h): {used24h}</span>
                          <span>
                            Left: {left} / {cap}
                          </span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
