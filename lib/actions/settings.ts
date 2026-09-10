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
  const resendApiKey = String(formData.get('resendApiKey') ?? '').trim();
  const resendWebhookSecret = String(formData.get('resendWebhookSecret') ?? '').trim();
  const emailFromAddress = String(formData.get('emailFromAddress') ?? '').trim();
  const emailFromName = String(formData.get('emailFromName') ?? '').trim();
  const defaultReplyTo = String(formData.get('defaultReplyTo') ?? '').trim();
  const defaultEmailWhatsappNumber = String(formData.get('defaultEmailWhatsappNumber') ?? '').trim();
  const defaultDeliveryChannel = String(formData.get('defaultDeliveryChannel') ?? 'whatsapp').trim();

  try {
    await backendFetch('/settings', {
      method: 'PATCH',
      body: JSON.stringify({
        defaultInterviewLink,
        defaultJobId,
        geminiApiKey,
        resendApiKey,
        resendWebhookSecret,
        emailFromAddress,
        emailFromName,
        defaultReplyTo,
        defaultEmailWhatsappNumber,
        defaultDeliveryChannel,
      }),
    });
  } catch (error) {
    return { error: error instanceof BackendError ? error.message : 'Failed to update settings' };
  }

  revalidatePath('/settings');
  revalidatePath('/interviews/new');
  return { success: true };
}

export interface EmailTestResult {
  success: boolean;
  message: string;
  details?: {
    domainCount?: number;
    fromDomain?: string;
    fromDomainStatus?: string;
  };
}

export async function testResendCredentials(resendApiKey: string, emailFromAddress: string): Promise<EmailTestResult> {
  if (!resendApiKey) {
    return { success: false, message: 'Enter a Resend API key first' };
  }
  try {
    return await backendFetch<EmailTestResult>('/email/test-credentials', {
      method: 'POST',
      body: JSON.stringify({ resendApiKey, emailFromAddress: emailFromAddress || undefined }),
    });
  } catch (error) {
    return { success: false, message: error instanceof BackendError ? error.message : 'Failed to test credentials' };
  }
}
