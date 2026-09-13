import { OrganizationsTable } from '@/components/organizations-table';
import { getOrganizations } from '@/lib/actions/organizations';

export default async function PlatformOrganizationsPage() {
  const organizations = await getOrganizations();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Organizations</h1>
      <OrganizationsTable organizations={organizations} />
    </div>
  );
}
