'use server';

import { revalidatePath } from 'next/cache';
import { backendFetch, BackendError } from '@/lib/backend';

export interface ImportIndeedRow {
  candidate_id?: string;
  name: string;
  email?: string;
  phone: string;
  location?: string;
  job_id?: string;
  job_title: string;
  applied_at?: string;
  interest_level?: string;
  milestone?: string;
  resume_url?: string;
  submission_uuid?: string;
}

export interface ImportRowError {
  row: number;
  candidateId?: string;
  message: string;
}

export interface ImportSummary {
  totalRows: number;
  jobsCreated: number;
  jobsMatched: number;
  contactsCreated: number;
  contactsMatched: number;
  submissionsCreated: number;
  submissionsUpdated: number;
  errors: ImportRowError[];
}

export interface ImportResult {
  summary?: ImportSummary;
  error?: string;
}

export async function importIndeedRows(rows: ImportIndeedRow[]): Promise<ImportResult> {
  try {
    const summary = await backendFetch<ImportSummary>('/import/indeed', {
      method: 'POST',
      body: JSON.stringify({ rows }),
    });
    revalidatePath('/');
    revalidatePath('/jobs');
    revalidatePath('/contacts');
    return { summary };
  } catch (error) {
    return { error: error instanceof BackendError ? error.message : 'Import failed' };
  }
}
