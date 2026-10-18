'use client';

import { FileRecord, UserSession } from '@/types';

const AUTH_KEY = 'vanish_user_session_v1';

export async function fetchFiles(): Promise<FileRecord[]> {
  try {
    const user = getCurrentUser();
    const headers: Record<string, string> = {};
    if (user.token) {
      headers['Authorization'] = `Bearer ${user.token}`;
    }
    const res = await fetch('/api/files', { 
      cache: 'no-store',
      credentials: 'include',
      headers
    });
    if (res.ok) {
      const data = await res.json();
      if (data.files && Array.isArray(data.files)) {
        return data.files;
      }
    }
  } catch (e) {
    console.warn('Backend fetch failed, using fallback', e);
  }
  return [];
}

export async function fetchFileById(id: string): Promise<FileRecord | null> {
  try {
    const res = await fetch(`/api/file/${id}`, { cache: 'no-store', credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      return data.file || null;
    }
  } catch (e) {
    console.warn('Backend fetchFileById failed', e);
  }
  return null;
}

export async function uploadRealFile(
  file: File,
  options: {
    duration: string;
    password?: string;
    maxDownloads?: number | null;
    ownerEmail?: string;
  }
): Promise<FileRecord> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('duration', options.duration);
  if (options.password) {
    formData.append('password', options.password);
  }
  if (options.maxDownloads) {
    formData.append('maxDownloads', options.maxDownloads.toString());
  }
  if (options.ownerEmail) {
    formData.append('ownerEmail', options.ownerEmail);
  }

  const user = getCurrentUser();
  const headers: Record<string, string> = {};
  if (user.token) {
    headers['Authorization'] = `Bearer ${user.token}`;
  }

  const res = await fetch('/api/upload', {
    method: 'POST',
    credentials: 'include',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Upload failed');
  }

  const data = await res.json();
  return data.file;
}

export async function unlockFilePassword(id: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const res = await fetch(`/api/file/${id}/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Incorrect password' };
    }
    return { success: true, token: data.accessToken };
  } catch {
    return { success: false, error: 'Network error verifying password' };
  }
}

export async function deleteFileApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/file/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function resetDatabaseApi(): Promise<boolean> {
  try {
    const res = await fetch('/api/reset', { method: 'POST' });
    return res.ok;
  } catch {
    return false;
  }
}

export function getCurrentUser(): UserSession {
  if (typeof window === 'undefined') {
    return { isLoggedIn: false, name: '', email: '' };
  }
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) {
      return { isLoggedIn: false, name: '', email: '' };
    }
    return JSON.parse(raw);
  } catch {
    return { isLoggedIn: false, name: '', email: '' };
  }
}

export function setMockUser(user: UserSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  if (user.token) {
    document.cookie = `auth_token=${encodeURIComponent(user.token)}; path=/; max-age=604800; SameSite=Lax`;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    });
  } catch {
    // ignore
  }

  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_KEY);
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  }
}

// Backward compatibility helpers
export function getStoredFiles(): FileRecord[] {
  return [];
}
export function resetDemoDatabase() {
  resetDatabaseApi();
}
export function deleteFileImmediately(id: string): boolean {
  deleteFileApi(id);
  return true;
}
