'use server';

import { revalidatePath } from 'next/cache';
import { backendFetch } from '@/lib/backend';
import type {
  CreateSubmissionResult,
  DeliveryChannel,
  EmailTemplateStats,
  PopulatedEmailSubmission,
  PopulatedSubmission,
} from '@/lib/types';

export async function getSubmissions(filters?: { jobId?: string; contactId?: string }): Promise<PopulatedSubmission[]> {
  const params = new URLSearchParams();
  if (filters?.jobId) params.set('jobId', filters.jobId);
  if (filters?.contactId) params.set('contactId', filters.contactId);
  const query = params.toString();
  return backendFetch<PopulatedSubmission[]>(`/submissions${query ? `?${query}` : ''}`);
}

export interface SubmissionsPageResult {
  items: PopulatedSubmission[];
  total: number;
}

export type EmailTrackingFilter = 'delivered' | 'opened' | 'clicked' | 'bounced';

export type CandidateStatusFilter =
  'whatsapp_sent' | 'whatsapp_failed' | 'email_sent' | 'email_failed' | 'not_contacted';

export type GenderFilter = 'male' | 'female' | 'unknown' | 'unclassified';

export async function getSubmissionsPage(options: {
  jobId?: string;
  contactId?: string;
  search?: string;
  gender?: GenderFilter[];
  tracking?: EmailTrackingFilter[];
  status?: CandidateStatusFilter[];
  limit?: number;
  skip?: number;
}): Promise<SubmissionsPageResult> {
  const params = new URLSearchParams();
  if (options.jobId) params.set('jobId', options.jobId);
  if (options.contactId) params.set('contactId', options.contactId);
  if (options.search) params.set('search', options.search);
  if (options.gender?.length) params.set('gender', options.gender.join(','));
  if (options.tracking?.length) params.set('tracking', options.tracking.join(','));
  if (options.status?.length) params.set('status', options.status.join(','));
  if (options.limit) params.set('limit', String(options.limit));
  if (options.skip) params.set('skip', String(options.skip));
  const query = params.toString();
  return backendFetch<SubmissionsPageResult>(`/submissions/page${query ? `?${query}` : ''}`);
}

export interface UsageLast24Hours {
  conversationsUsed: number;
  messagesSent: number;
}

export async function getUsageLast24Hours(): Promise<UsageLast24Hours> {
  return backendFetch<UsageLast24Hours>('/submissions/usage-24h');
}

export interface AccountStats {
  totalSubmissions: number;
  conversationsUsed24h: number;
  messagesSent24h: number;
}

export async function getStatsByAccount(): Promise<Record<string, AccountStats>> {
  return backendFetch<Record<string, AccountStats>>('/submissions/stats-by-account');
}

export type EmailStatusFilter = 'sent' | 'failed';

export interface EmailSubmissionsPageResult {
  items: PopulatedEmailSubmission[];
  total: number;
}

export async function getEmailSubmissionsPage(options: {
  contactId?: string;
  search?: string;
  gender?: GenderFilter[];
  status?: EmailStatusFilter[];
  tracking?: EmailTrackingFilter[];
  limit?: number;
  skip?: number;
}): Promise<EmailSubmissionsPageResult> {
  const params = new URLSearchParams();
  if (options.contactId) params.set('contactId', options.contactId);
  if (options.search) params.set('search', options.search);
  if (options.gender?.length) params.set('gender', options.gender.join(','));
  if (options.status?.length) params.set('status', options.status.join(','));
  if (options.tracking?.length) params.set('tracking', options.tracking.join(','));
  if (options.limit) params.set('limit', String(options.limit));
  if (options.skip) params.set('skip', String(options.skip));
  const query = params.toString();
  return backendFetch<EmailSubmissionsPageResult>(`/submissions/emails${query ? `?${query}` : ''}`);
}

// Used only by the contact detail page, where "every email sent to this one contact" is inherently
// a small, bounded list — a generous limit instead of true pagination is enough here.
export async function getEmailSubmissions(filters?: { contactId?: string }): Promise<PopulatedEmailSubmission[]> {
  const result = await getEmailSubmissionsPage({ contactId: filters?.contactId, limit: 200 });
  return result.items;
}

export async function getSubmissionCountsByJob(): Promise<Record<string, number>> {
  return backendFetch<Record<string, number>>('/submissions/counts-by-job');
}

export interface EmailStatsResponse {
  overall: EmailTemplateStats;
  byTemplate: Record<string, EmailTemplateStats>;
}

export async function getEmailStats(since?: Date): Promise<EmailStatsResponse> {
  const query = since ? `?since=${encodeURIComponent(since.toISOString())}` : '';
  return backendFetch<EmailStatsResponse>(`/submissions/email-stats${query}`);
}

export async function getSubmissionsCount(since?: Date): Promise<number> {
  const query = since ? `?since=${encodeURIComponent(since.toISOString())}` : '';
  return backendFetch<number>(`/submissions/count-in-range${query}`);
}

export interface EmailUsage {
  sentToday: number;
  sentThisMonth: number;
}

export async function getEmailUsage(): Promise<EmailUsage> {
  return backendFetch<EmailUsage>('/submissions/email-usage');
}

export interface CreateSubmissionInput {
  jobId: string;
  contactId?: string;
  firstName?: string;
  lastName?: string;
  whatsapp?: string;
  email?: string;
  notes?: string;
  templateKey?: string;
  variables?: Record<string, string>;
  force?: boolean;
  whatsappAccountId?: string;
  channel?: DeliveryChannel;
  emailTemplateId?: string;
}

export async function createSubmission(input: CreateSubmissionInput): Promise<CreateSubmissionResult> {
  return backendFetch<CreateSubmissionResult>('/submissions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function resendSubmissionAction(submissionId: string): Promise<CreateSubmissionResult> {
  const result = await backendFetch<CreateSubmissionResult>(`/submissions/${submissionId}/resend`, {
    method: 'POST',
  });
  revalidatePath('/interviews');
  revalidatePath(`/contacts`);
  return result;
}

export async function deleteSubmissionAction(submissionId: string): Promise<void> {
  await backendFetch(`/submissions/${submissionId}`, { method: 'DELETE' });
  revalidatePath('/interviews');
  revalidatePath('/contacts');
  revalidatePath('/jobs');
}
