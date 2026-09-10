'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { backendFetch, BackendError } from '@/lib/backend';
import type { Job } from '@/lib/types';

export interface JobFormState {
  error?: string;
}

export async function getJobs(): Promise<Job[]> {
  return backendFetch<Job[]>('/jobs');
}

export async function getJob(id: string): Promise<Job> {
  return backendFetch<Job>(`/jobs/${id}`);
}

export async function createJobAction(_prevState: JobFormState, formData: FormData): Promise<JobFormState> {
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const indeedJobId = String(formData.get('indeedJobId') ?? '').trim();

  if (!title) {
    return { error: 'Title is required' };
  }

  try {
    await backendFetch('/jobs', {
      method: 'POST',
      body: JSON.stringify({ title, description: description || undefined, indeedJobId: indeedJobId || undefined }),
    });
  } catch (error) {
    return { error: error instanceof BackendError ? error.message : 'Failed to create job' };
  }

  revalidatePath('/jobs');
  redirect('/jobs');
}

export async function updateJobAction(id: string, _prevState: JobFormState, formData: FormData): Promise<JobFormState> {
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const indeedJobId = String(formData.get('indeedJobId') ?? '').trim();
  const isActive = formData.get('isActive') === 'on';

  if (!title) {
    return { error: 'Title is required' };
  }

  try {
    await backendFetch(`/jobs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title,
        description: description || undefined,
        indeedJobId: indeedJobId || undefined,
        isActive,
      }),
    });
  } catch (error) {
    return { error: error instanceof BackendError ? error.message : 'Failed to update job' };
  }

  revalidatePath('/jobs');
  redirect('/jobs');
}

export async function deleteJobAction(id: string): Promise<void> {
  await backendFetch(`/jobs/${id}`, { method: 'DELETE' });
  revalidatePath('/jobs');
}
