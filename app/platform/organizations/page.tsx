import { OrganizationsTable } from '@/components/organizations-table';
import { getOrganizations } from '@/lib/actions/organizations';

// This calls out to the backend with a secret from process.env — it must never be attempted
// during the build's static-generation pass (which may run before that env var exists yet),
// only at request time.
export const dynamic = 'force-dynamic';

export default async function PlatformOrganizationsPage() {
  const organizations = await getOrganizations();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Organizations</h1>
      <OrganizationsTable organizations={organizations} />
    </div>
  );
}
