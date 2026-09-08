'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { backendFetch, BackendError } from '@/lib/backend';
import type { Contact } from '@/lib/types';

export async function getContacts(): Promise<Contact[]> {
  return backendFetch<Contact[]>('/contacts');
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
  const notes = String(formData.get('notes') ?? '').trim();

  if (!firstName || !lastName || !whatsapp) {
    return { error: 'First name, last name and WhatsApp number are required' };
  }

  try {
    await backendFetch('/contacts', {
      method: 'POST',
      body: JSON.stringify({ firstName, lastName, whatsapp, notes: notes || undefined }),
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
  const notes = String(formData.get('notes') ?? '').trim();

  if (!firstName || !lastName || !whatsapp) {
    return { error: 'First name, last name and WhatsApp number are required' };
  }

  try {
    await backendFetch(`/contacts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ firstName, lastName, whatsapp, notes: notes || undefined }),
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
