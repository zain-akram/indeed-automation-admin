'use server';

import { revalidatePath } from 'next/cache';
import { backendFetch, BackendError } from '@/lib/backend';
import type { Setting } from '@/lib/types';

export interface SettingsFormState {
  error?: string;
  success?: boolean;
}

export async function getSettings(): Promise<Setting> {
  return backendFetch<Setting>('/settings');
}

export async function updateSettingsAction(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const defaultInterviewLink = String(formData.get('defaultInterviewLink') ?? '').trim();
  const defaultJobId = String(formData.get('defaultJobId') ?? '').trim();
  const geminiApiKey = String(formData.get('geminiApiKey') ?? '').trim();

  try {
    await backendFetch('/settings', {
      method: 'PATCH',
      body: JSON.stringify({
        defaultInterviewLink,
        defaultJobId,
        geminiApiKey,
      }),
    });
  } catch (error) {
    return { error: error instanceof BackendError ? error.message : 'Failed to update settings' };
  }

  revalidatePath('/settings');
  revalidatePath('/interviews/new');
  return { success: true };
}
