'use server';

import { revalidatePath } from 'next/cache';
import { PlatformBackendError, platformFetch } from '@/lib/platform-backend';

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
}

export async function getOrganizations(): Promise<Organization[]> {
  return platformFetch<Organization[]>('/organizations');
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
    const result = await platformFetch<OrganizationWithSecret>('/organizations', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    revalidatePath('/platform/organizations');
    return { secret: result.secret };
  } catch (error) {
    return { error: error instanceof PlatformBackendError ? error.message : 'Failed to create organization' };
  }
}

export async function rotateOrganizationSecretAction(id: string): Promise<OrganizationActionState> {
  try {
    const result = await platformFetch<OrganizationWithSecret>(`/organizations/${id}/rotate-secret`, {
      method: 'POST',
    });
    revalidatePath('/platform/organizations');
    return { secret: result.secret };
  } catch (error) {
    return { error: error instanceof PlatformBackendError ? error.message : 'Failed to rotate secret' };
  }
}

export async function setOrganizationActiveAction(id: string, isActive: boolean): Promise<void> {
  await platformFetch(`/organizations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
  revalidatePath('/platform/organizations');
}

export async function deleteOrganizationAction(id: string): Promise<{ error?: string }> {
  try {
    await platformFetch(`/organizations/${id}`, { method: 'DELETE' });
    revalidatePath('/platform/organizations');
    return {};
  } catch (error) {
    return { error: error instanceof PlatformBackendError ? error.message : 'Failed to delete organization' };
  }
}
