import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BreadcrumbLabel } from '@/components/breadcrumb-label';
import { JobSubmissionsTable } from '@/components/job-submissions-table';
import { getEmailTemplates } from '@/lib/actions/email-templates';
import { getJob } from '@/lib/actions/jobs';
import { getSubmissionsPage } from '@/lib/actions/submissions';
import { getActiveWhatsappAccount, getWhatsappAccounts } from '@/lib/actions/whatsapp-accounts';
import type { TemplateDef } from '@/lib/types';

const PAGE_SIZE = 50;

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [job, submissionsPage, whatsappAccounts, activeAccount, emailTemplates] = await Promise.all([
    getJob(id),
    getSubmissionsPage({ jobId: id, limit: PAGE_SIZE }),
    getWhatsappAccounts(),
    getActiveWhatsappAccount(),
    getEmailTemplates(),
  ]);

  const templatesByAccount: Record<string, TemplateDef[]> = {};
  for (const account of whatsappAccounts) {
    templatesByAccount[account._id] = account.templates ?? [];
  }

  return (
    <div className="flex flex-col gap-6">
      <BreadcrumbLabel path={`/jobs/${id}`} label={job.title} />
      <div>
        <h1 className="text-xl font-semibold">{job.title}</h1>
        <Badge variant={job.isActive ? 'default' : 'secondary'}>{job.isActive ? 'Active' : 'Inactive'}</Badge>
      </div>

      {job.description ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{job.description}</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Submissions for this Job</h2>
        <JobSubmissionsTable
          jobId={id}
          job={job}
          initialItems={submissionsPage.items}
          initialTotal={submissionsPage.total}
          pageSize={PAGE_SIZE}
          whatsappAccounts={whatsappAccounts}
          defaultWhatsappAccountId={activeAccount?._id}
          emailTemplates={emailTemplates}
          templatesByAccount={templatesByAccount}
        />
      </div>
    </div>
  );
}
