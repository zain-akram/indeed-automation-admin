import { Button } from '@/components/ui/button';
import { platformLogout } from '../login/actions';

export default function PlatformOrganizationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-14 items-center justify-between gap-2 border-b px-4">
        <span className="text-sm font-semibold">Organizations</span>
        <form action={platformLogout}>
          <Button type="submit" variant="ghost" size="sm">
            Log out
          </Button>
        </form>
      </header>
      <main className="flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}
