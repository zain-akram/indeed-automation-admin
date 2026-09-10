'use server';

import { revalidatePath } from 'next/cache';
import { backendFetch, BackendError } from '@/lib/backend';
import type { TemplateDef, WhatsappAccount } from '@/lib/types';

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

export type MetaTemplate = TemplateDef;

export interface TemplateSyncResult {
  success: boolean;
  message?: string;
  templates?: MetaTemplate[];
}

export interface WhatsappAccountFormState {
  error?: string;
  success?: boolean;
}

export async function getWhatsappAccounts(): Promise<WhatsappAccount[]> {
  return backendFetch<WhatsappAccount[]>('/whatsapp-accounts');
}

export async function getActiveWhatsappAccount(): Promise<WhatsappAccount | null> {
  return backendFetch<WhatsappAccount | null>('/whatsapp-accounts/active');
}

function revalidateWhatsappAccounts() {
  revalidatePath('/settings');
  revalidatePath('/');
  revalidatePath('/interviews/new');
}

export async function createWhatsappAccountAction(
  _prevState: WhatsappAccountFormState,
  formData: FormData,
): Promise<WhatsappAccountFormState> {
  const label = String(formData.get('label') ?? '').trim();
  const whatsappBusinessId = String(formData.get('whatsappBusinessId') ?? '').trim();
  const whatsappPhoneNumberId = String(formData.get('whatsappPhoneNumberId') ?? '').trim();
  const whatsappApiToken = String(formData.get('whatsappApiToken') ?? '').trim();

  if (!label || !whatsappBusinessId || !whatsappPhoneNumberId || !whatsappApiToken) {
    return { error: 'All fields are required' };
  }

  try {
    await backendFetch('/whatsapp-accounts', {
      method: 'POST',
      body: JSON.stringify({ label, whatsappBusinessId, whatsappPhoneNumberId, whatsappApiToken }),
    });
  } catch (error) {
    return { error: error instanceof BackendError ? error.message : 'Failed to add WhatsApp account' };
  }

  revalidateWhatsappAccounts();
  return { success: true };
}

export async function updateWhatsappAccountAction(
  id: string,
  data: {
    label: string;
    whatsappBusinessId: string;
    whatsappPhoneNumberId: string;
    whatsappApiToken: string;
    defaultTemplateKey?: string;
  },
): Promise<WhatsappAccountFormState> {
  try {
    await backendFetch(`/whatsapp-accounts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  } catch (error) {
    return { error: error instanceof BackendError ? error.message : 'Failed to update WhatsApp account' };
  }

  revalidateWhatsappAccounts();
  return {};
}

export async function deleteWhatsappAccountAction(id: string): Promise<void> {
  await backendFetch(`/whatsapp-accounts/${id}`, { method: 'DELETE' });
  revalidateWhatsappAccounts();
}

export async function activateWhatsappAccountAction(id: string): Promise<void> {
  await backendFetch(`/whatsapp-accounts/${id}/activate`, { method: 'POST' });
  revalidateWhatsappAccounts();
}

export async function testWhatsappAccountCredentials(
  whatsappApiToken: string,
  whatsappPhoneNumberId: string,
): Promise<WhatsappTestResult> {
  if (!whatsappApiToken || !whatsappPhoneNumberId) {
    return { success: false, message: 'Enter both an access token and phone number ID first' };
  }
  try {
    return await backendFetch<WhatsappTestResult>('/whatsapp-accounts/test-credentials', {
      method: 'POST',
      body: JSON.stringify({ whatsappApiToken, whatsappPhoneNumberId }),
    });
  } catch (error) {
    return { success: false, message: error instanceof BackendError ? error.message : 'Failed to test credentials' };
  }
}

export async function testWhatsappAccountById(accountId: string): Promise<WhatsappTestResult> {
  try {
    const result = await backendFetch<WhatsappTestResult>(`/whatsapp-accounts/${accountId}/test`, {
      method: 'POST',
    });
    revalidateWhatsappAccounts();
    return result;
  } catch (error) {
    return { success: false, message: error instanceof BackendError ? error.message : 'Failed to test credentials' };
  }
}

export async function syncWhatsappAccountTemplates(accountId: string): Promise<TemplateSyncResult> {
  try {
    const result = await backendFetch<TemplateSyncResult>(`/whatsapp-accounts/${accountId}/sync-templates`);
    revalidateWhatsappAccounts();
    return result;
  } catch (error) {
    return { success: false, message: error instanceof BackendError ? error.message : 'Failed to sync templates' };
  }
}
