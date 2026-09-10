'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { backendFetch, BackendError } from '@/lib/backend';
import { isValidWhatsapp, WHATSAPP_ERROR } from '@/lib/phone';
import type { Contact, ContactFile } from '@/lib/types';

export async function getContacts(): Promise<Contact[]> {
  return backendFetch<Contact[]>('/contacts');
}

export interface ContactPageRow extends Contact {
  interviewCount: number;
  resumeUrl?: string;
}

export interface ContactsPageResult {
  items: ContactPageRow[];
  total: number;
}

export async function getContactsPage(options: {
  search?: string;
  limit?: number;
  skip?: number;
}): Promise<ContactsPageResult> {
  const params = new URLSearchParams();
  if (options.search) params.set('search', options.search);
  if (options.limit) params.set('limit', String(options.limit));
  if (options.skip) params.set('skip', String(options.skip));
  const query = params.toString();
  return backendFetch<ContactsPageResult>(`/contacts/page${query ? `?${query}` : ''}`);
}

export async function getContact(id: string): Promise<Contact> {
  return backendFetch<Contact>(`/contacts/${id}`);
}

export interface ContactFormState {
  error?: string;
}

export async function createContactAction(_prevState: ContactFormState, formData: FormData): Promise<ContactFormState> {
  const firstName = String(formData.get('firstName') ?? '').trim();
  const lastName = String(formData.get('lastName') ?? '').trim();
  const whatsapp = String(formData.get('whatsapp') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const notes = String(formData.get('notes') ?? '').trim();

  if (!firstName || !lastName || !whatsapp) {
    return { error: 'First name, last name and WhatsApp number are required' };
  }

  if (!isValidWhatsapp(whatsapp)) {
    return { error: WHATSAPP_ERROR };
  }

  try {
    await backendFetch('/contacts', {
      method: 'POST',
      body: JSON.stringify({ firstName, lastName, whatsapp, email: email || undefined, notes: notes || undefined }),
    });
  } catch (error) {
    return { error: error instanceof BackendError ? error.message : 'Failed to create contact' };
  }

  revalidatePath('/contacts');
  redirect('/contacts');
}

export async function updateContactAction(
  id: string,
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const firstName = String(formData.get('firstName') ?? '').trim();
  const lastName = String(formData.get('lastName') ?? '').trim();
  const whatsapp = String(formData.get('whatsapp') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const notes = String(formData.get('notes') ?? '').trim();

  if (!firstName || !lastName || !whatsapp) {
    return { error: 'First name, last name and WhatsApp number are required' };
  }

  if (!isValidWhatsapp(whatsapp)) {
    return { error: WHATSAPP_ERROR };
  }

  try {
    await backendFetch(`/contacts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ firstName, lastName, whatsapp, email: email || undefined, notes: notes || undefined }),
    });
  } catch (error) {
    return { error: error instanceof BackendError ? error.message : 'Failed to update contact' };
  }

  revalidatePath('/contacts');
  redirect('/contacts');
}

export async function deleteContactAction(id: string): Promise<void> {
  await backendFetch(`/contacts/${id}`, { method: 'DELETE' });
  revalidatePath('/contacts');
}

export async function appendContactNotesAction(id: string, notes: string): Promise<void> {
  await backendFetch(`/contacts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ notes }),
  });
  revalidatePath(`/contacts/${id}`);
  revalidatePath('/contacts');
}

export async function getContactFiles(contactId: string): Promise<ContactFile[]> {
  return backendFetch<ContactFile[]>(`/contacts/${contactId}/files`);
}

export interface UploadFileState {
  error?: string;
  success?: boolean;
}

export async function uploadContactFileAction(
  contactId: string,
  _prevState: UploadFileState,
  formData: FormData,
): Promise<UploadFileState> {
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Select a file to upload' };
  }

  const uploadForm = new FormData();
  uploadForm.set('file', file, file.name);

  try {
    await backendFetch(`/contacts/${contactId}/files`, {
      method: 'POST',
      body: uploadForm,
    });
  } catch (error) {
    return { error: error instanceof BackendError ? error.message : 'Failed to upload file' };
  }

  revalidatePath(`/contacts/${contactId}`);
  return { success: true };
}

export async function deleteContactFileAction(contactId: string, fileId: string): Promise<void> {
  await backendFetch(`/contacts/${contactId}/files/${fileId}`, { method: 'DELETE' });
  revalidatePath(`/contacts/${contactId}`);
}

export interface AutofillResult {
  firstName?: string;
  lastName?: string;
  whatsapp?: string;
  email?: string;
  notes?: string;
}

export interface AutofillState {
  data?: AutofillResult;
  error?: string;
}

export async function autofillContactAction(formData: FormData): Promise<AutofillState> {
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Select an image to autofill from' };
  }

  const uploadForm = new FormData();
  uploadForm.set('file', file, file.name);

  try {
    const data = await backendFetch<AutofillResult>('/contacts/autofill', {
      method: 'POST',
      body: uploadForm,
    });
    return { data };
  } catch (error) {
    return { error: error instanceof BackendError ? error.message : 'Failed to autofill from image' };
  }
}
