'use client';

import { ChevronRightIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBreadcrumbContext } from '@/components/breadcrumb-context';

const ROUTE_LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/jobs': 'Jobs',
  '/jobs/new': 'New Job',
  '/contacts': 'Contacts',
  '/contacts/new': 'New Contact',
  '/interviews': 'Interviews',
  '/interviews/new': 'New Interview',
  '/settings': 'Settings',
};

const PARENT_ENTITY_LABELS: Record<string, string> = {
  jobs: 'Job',
  contacts: 'Contact',
  interviews: 'Interview',
};

function labelForSegment(segments: string[], index: number): string {
  const fullPath = `/${segments.slice(0, index + 1).join('/')}`;
  if (ROUTE_LABELS[fullPath]) {
    return ROUTE_LABELS[fullPath];
  }
  const segment = segments[index];
  if (segment === 'edit') {
    return 'Edit';
  }
  if (segment === 'new') {
    return 'New';
  }
  // A dynamic id segment — describe it by its parent list (e.g. "jobs" -> "Job").
  return PARENT_ENTITY_LABELS[segments[index - 1]] ?? 'Details';
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const { overrides } = useBreadcrumbContext();

  if (pathname === '/login') {
    return null;
  }

  const segments = pathname.split('/').filter(Boolean);
  const crumbs = [
    { href: '/', label: ROUTE_LABELS['/'] },
    ...segments.map((_, index) => {
      const href = `/${segments.slice(0, index + 1).join('/')}`;
      return { href, label: overrides[href] ?? labelForSegment(segments, index) };
    }),
  ];

  if (crumbs.length < 2) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <span key={crumb.href} className="flex shrink-0 items-center gap-1">
            {index > 0 ? <ChevronRightIcon className="size-3 shrink-0" /> : null}
            {isLast ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-foreground hover:underline">
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
