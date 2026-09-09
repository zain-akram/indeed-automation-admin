'use server';

import { revalidatePath } from 'next/cache';
import { backendFetch, BackendError } from '@/lib/backend';
import type { Setting } from '@/lib/types';

export interface SettingsFormState {
  error?: string;
  success?: boolean;
}

export interface WhatsappTestResult {
  success: boolean;
  message: string;
  details?: {
    verifiedName?: string;
    displayPhoneNumber?: string;
    status?: string;
    qualityRating?: string;
    codeVerificationStatus?: string;
    messagingLimitTier?: string;
    messagingLimitCap?: number | null;
  };
}

export interface TemplateSyncStatus {
  key: string;
  label: string;
  configuredLanguage: string;
  found: boolean;
  metaStatus?: string;
  metaLanguage?: string;
  metaCategory?: string;
  languageMismatch: boolean;
}

export interface TemplateSyncResult {
  success: boolean;
  message?: string;
  templates?: TemplateSyncStatus[];
}

export async function getSettings(): Promise<Setting> {
  return backendFetch<Setting>('/settings');
}

export async function syncWhatsappTemplates(): Promise<TemplateSyncResult> {
  try {
    return await backendFetch<TemplateSyncResult>('/settings/sync-templates');
  } catch (error) {
    return { success: false, message: error instanceof BackendError ? error.message : 'Failed to sync templates' };
  }
}

export async function testWhatsappCredentials(
  whatsappApiToken: string,
  whatsappPhoneNumberId: string,
): Promise<WhatsappTestResult> {
  if (!whatsappApiToken || !whatsappPhoneNumberId) {
    return { success: false, message: 'Enter both an access token and phone number ID first' };
  }
  try {
    return await backendFetch<WhatsappTestResult>('/settings/test-whatsapp', {
      method: 'POST',
      body: JSON.stringify({ whatsappApiToken, whatsappPhoneNumberId }),
    });
  } catch (error) {
    return { success: false, message: error instanceof BackendError ? error.message : 'Failed to test credentials' };
  }
}

export async function updateSettingsAction(_prevState: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const defaultInterviewLink = String(formData.get('defaultInterviewLink') ?? '').trim();
  const whatsappBusinessId = String(formData.get('whatsappBusinessId') ?? '').trim();
  const whatsappPhoneNumberId = String(formData.get('whatsappPhoneNumberId') ?? '').trim();
  const whatsappApiToken = String(formData.get('whatsappApiToken') ?? '').trim();
  const geminiApiKey = String(formData.get('geminiApiKey') ?? '').trim();

  try {
    await backendFetch('/settings', {
      method: 'PATCH',
      body: JSON.stringify({
        defaultInterviewLink,
        whatsappBusinessId,
        whatsappPhoneNumberId,
        whatsappApiToken,
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
