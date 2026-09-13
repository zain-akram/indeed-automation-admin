'use server';

import { revalidatePath } from 'next/cache';
import { backendFetch, BackendError } from '@/lib/backend';

export interface Organization {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationWithSecret extends Organization {
  secret: string;
}

export interface OrganizationActionState {
  error?: string;
  secret?: string;
  organizationId?: string;
}

export async function getOrganizations(): Promise<Organization[]> {
  return backendFetch<Organization[]>('/organizations');
}

export async function createOrganizationAction(
  _prevState: OrganizationActionState,
  formData: FormData,
): Promise<OrganizationActionState> {
  const name = String(formData.get('name') ?? '').trim();
  if (!name) {
    return { error: 'Name is required' };
  }
  try {
    const result = await backendFetch<OrganizationWithSecret>('/organizations', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    revalidatePath('/', 'layout');
    return { secret: result.secret, organizationId: result._id };
  } catch (error) {
    return { error: error instanceof BackendError ? error.message : 'Failed to create organization' };
  }
}

export async function rotateOrganizationSecretAction(id: string): Promise<OrganizationActionState> {
  try {
    const result = await backendFetch<OrganizationWithSecret>(`/organizations/${id}/rotate-secret`, {
      method: 'POST',
    });
    return { secret: result.secret };
  } catch (error) {
    return { error: error instanceof BackendError ? error.message : 'Failed to rotate secret' };
  }
}

export async function setOrganizationActiveAction(id: string, isActive: boolean): Promise<void> {
  await backendFetch(`/organizations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
  revalidatePath('/', 'layout');
}

export async function deleteOrganizationAction(id: string): Promise<{ error?: string }> {
  try {
    await backendFetch(`/organizations/${id}`, { method: 'DELETE' });
    revalidatePath('/', 'layout');
    return {};
  } catch (error) {
    return { error: error instanceof BackendError ? error.message : 'Failed to delete organization' };
  }
}
