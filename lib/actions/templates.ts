'use server';

import { backendFetch } from '@/lib/backend';
import type { TemplateDef } from '@/lib/types';

export async function getTemplates(): Promise<TemplateDef[]> {
  return backendFetch<TemplateDef[]>('/templates');
}
