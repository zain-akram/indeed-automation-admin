'use client';

import { useEffect } from 'react';
import { useBreadcrumbContext } from '@/components/breadcrumb-context';

/** Registers a friendly label (e.g. a contact's name or a job title) for a breadcrumb path segment. */
export function BreadcrumbLabel({ path, label }: { path: string; label: string }) {
  const { setOverride, clearOverride } = useBreadcrumbContext();

  useEffect(() => {
    setOverride(path, label);
    return () => clearOverride(path);
  }, [path, label, setOverride, clearOverride]);

  return null;
}
