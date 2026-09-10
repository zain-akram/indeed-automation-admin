'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { backendFetch, BackendError } from '@/lib/backend';
import type { EmailTemplate } from '@/lib/types';

export interface EmailTemplateFormState {
  error?: string;
}

function revalidateEmailTemplates() {
  revalidatePath('/email-templates');
  revalidatePath('/interviews/new');
}

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  return backendFetch<EmailTemplate[]>('/email-templates');
}

export async function getEmailTemplate(id: string): Promise<EmailTemplate> {
  return backendFetch<EmailTemplate>(`/email-templates/${id}`);
}

export async function createEmailTemplateAction(
  _prevState: EmailTemplateFormState,
  formData: FormData,
): Promise<EmailTemplateFormState> {
  const label = String(formData.get('label') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const subject = String(formData.get('subject') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();
  const replyTo = String(formData.get('replyTo') ?? '').trim();

  if (!label || !subject || !body) {
    return { error: 'Label, subject and body are all required' };
  }

  try {
    await backendFetch('/email-templates', {
      method: 'POST',
      body: JSON.stringify({
        label,
        description: description || undefined,
        subject,
        body,
        replyTo: replyTo || undefined,
      }),
    });
  } catch (error) {
    return { error: error instanceof BackendError ? error.message : 'Failed to create email template' };
  }

  revalidateEmailTemplates();
  redirect('/email-templates');
}

export async function updateEmailTemplateAction(
  id: string,
  _prevState: EmailTemplateFormState,
  formData: FormData,
): Promise<EmailTemplateFormState> {
  const label = String(formData.get('label') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const subject = String(formData.get('subject') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();
  const replyTo = String(formData.get('replyTo') ?? '').trim();

  if (!label || !subject || !body) {
    return { error: 'Label, subject and body are all required' };
  }

  try {
    await backendFetch(`/email-templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        label,
        description: description || undefined,
        subject,
        body,
        replyTo: replyTo || undefined,
      }),
    });
  } catch (error) {
    return { error: error instanceof BackendError ? error.message : 'Failed to update email template' };
  }

  revalidateEmailTemplates();
  redirect('/email-templates');
}

export async function deleteEmailTemplateAction(id: string): Promise<void> {
  await backendFetch(`/email-templates/${id}`, { method: 'DELETE' });
  revalidateEmailTemplates();
}

export async function setDefaultEmailTemplateAction(id: string): Promise<void> {
  await backendFetch(`/email-templates/${id}/default`, { method: 'POST' });
  revalidateEmailTemplates();
}
