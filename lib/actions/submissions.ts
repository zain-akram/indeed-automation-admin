'use server';

import { backendFetch } from '@/lib/backend';
import type { CreateSubmissionResult, PopulatedSubmission } from '@/lib/types';

export async function getSubmissions(filters?: { jobId?: string; contactId?: string }): Promise<PopulatedSubmission[]> {
  const params = new URLSearchParams();
  if (filters?.jobId) params.set('jobId', filters.jobId);
  if (filters?.contactId) params.set('contactId', filters.contactId);
  const query = params.toString();
  return backendFetch<PopulatedSubmission[]>(`/submissions${query ? `?${query}` : ''}`);
}

export interface UsageLast24Hours {
  conversationsUsed: number;
  messagesSent: number;
}

export async function getUsageLast24Hours(): Promise<UsageLast24Hours> {
  return backendFetch<UsageLast24Hours>('/submissions/usage-24h');
}

export interface CreateSubmissionInput {
  jobId: string;
  contactId?: string;
  firstName?: string;
  lastName?: string;
  whatsapp?: string;
  notes?: string;
  templateKey: string;
  variables?: Record<string, string>;
  force?: boolean;
}

export async function createSubmission(input: CreateSubmissionInput): Promise<CreateSubmissionResult> {
  return backendFetch<CreateSubmissionResult>('/submissions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
