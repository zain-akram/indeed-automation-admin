import { cookies } from 'next/headers';
import { logout } from '@/app/login/actions';
import { AppSidebar } from '@/components/app-sidebar';
import { BreadcrumbProvider } from '@/components/breadcrumb-context';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { OrgSwitcher } from '@/components/org-switcher';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { SESSION_COOKIE_NAME, verifyOrgsSessionToken } from '@/lib/session';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = await verifyOrgsSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  const orgs = session?.orgs.map((org) => ({ organizationId: org.organizationId, name: org.name })) ?? [];

  return (
    <BreadcrumbProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 items-center justify-between gap-2 border-b px-4">
            <div className="flex min-w-0 items-center gap-2">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-4 !self-center" />
              <Breadcrumbs />
            </div>
            <div className="flex items-center gap-2">
              {session ? <OrgSwitcher orgs={orgs} activeOrganizationId={session.activeOrganizationId} /> : null}
              <form action={logout}>
                <Button type="submit" variant="ghost" size="sm">
                  Log out
                </Button>
              </form>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </BreadcrumbProvider>
  );
}
