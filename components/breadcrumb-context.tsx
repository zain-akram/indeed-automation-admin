'use client';

import { createContext, useCallback, useContext, useState } from 'react';

interface BreadcrumbContextValue {
  overrides: Record<string, string>;
  setOverride: (path: string, label: string) => void;
  clearOverride: (path: string) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const setOverride = useCallback((path: string, label: string) => {
    setOverrides((prev) => (prev[path] === label ? prev : { ...prev, [path]: label }));
  }, []);

  const clearOverride = useCallback((path: string) => {
    setOverrides((prev) => {
      if (!(path in prev)) {
        return prev;
      }
      const next = { ...prev };
      delete next[path];
      return next;
    });
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ overrides, setOverride, clearOverride }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbContext(): BreadcrumbContextValue {
  const ctx = useContext(BreadcrumbContext);
  if (!ctx) {
    throw new Error('useBreadcrumbContext must be used within a BreadcrumbProvider');
  }
  return ctx;
}
