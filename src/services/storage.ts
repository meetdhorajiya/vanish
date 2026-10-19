'use client';

import { FileRecord, UserSession, SystemMetrics, AccessLog } from '@/types';
import { generateSecureId } from './crypto';

const STORAGE_KEY = 'vanish_files_db_v2';
const AUTH_KEY = 'vanish_user_session_v1';
const AUTH_KEY_LEGACY = 'vanish_user_session_v2';
const SCRUBBED_COUNTER_KEY = 'vanish_total_scrubbed_bytes_v2';

// In-memory subscribers for live reactivity
const listeners = new Set<() => void>();
function notifySubscribers() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error('Subscriber notify error', e);
    }
  });
}

// BroadcastChannel for cross-tab sync if supported
let broadcastChannel: typeof window extends undefined ? null : BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('vanish_sync_channel');
    broadcastChannel.onmessage = () => {
      notifySubscribers();
    };
  } catch {
    // Channel not supported
  }
}

export function notifyAll() {
  notifySubscribers();
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage('sync');
    } catch {
      // Ignore
    }
  }
}

export function subscribeToStore(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

// Seed Initial Data
export function generateSeedFiles(): FileRecord[] {
  const now = Date.now();
  return [
    {
      id: 'demo-active',
      name: 'IIITV_Design_Project_Report.pdf',
      size: 2457600, // 2.4 MB
      mimeType: 'application/pdf',
      uploadedAt: now - 1000 * 60 * 35,
      expiresAt: now + 1000 * 60 * 60 * 5 + 1000 * 60 * 24, // ~5 hours 24 mins
      durationLabel: '6 Hours',
      hasPassword: false,
      downloadCount: 3,
      maxDownloads: 10,
      status: 'active',
      ownerEmail: 'meet@iiitv.ac.in',
      ownerName: 'Meet Dhorajiya',
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      isClientEncrypted: true,
      blobDataUrl: 'data:application/pdf;base64,JVBERi0xLjMKJcfsj6IKNSAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDQgMCBSCi9NZWRpYUJveCBbMCAwIDYxMiA3OTJdCi9Db250ZW50cyA2IDAgUgo+PgplbmRvYmoKNiAwIG9iago8PAovTGVuZ3RoIDQ3Cj4+CnN0cmVhbQpCVAovRjEgMTIgVGYKNzIgNzEyIFRECihoZWxsbyB3b3JsZCkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iag==',
      accessLogs: [
        {
          id: 'log-1',
          timestamp: now - 1000 * 60 * 30,
          action: 'viewed',
          ipHash: 'sha256:8f4c...9a21',
          location: 'Gandhinagar, Gujarat',
          clientSnippet: 'Chrome 122 / MacOS'
        },
        {
          id: 'log-2',
          timestamp: now - 1000 * 60 * 18,
          action: 'downloaded',
          ipHash: 'sha256:3d1e...bc44',
          location: 'Vadodara, Gujarat',
          clientSnippet: 'Firefox 123 / Windows 11'
        },
        {
          id: 'log-3',
          timestamp: now - 1000 * 60 * 4,
          action: 'downloaded',
          ipHash: 'sha256:1a8b...77f2',
          location: 'Ahmedabad, Gujarat',
          clientSnippet: 'Safari 17 / iOS 17'
        }
      ]
    },
    {
      id: 'demo-locked',
      name: 'Confidential_Financial_Audit_2026.xlsx',
      size: 1548200, // 1.5 MB
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      uploadedAt: now - 1000 * 60 * 90,
      expiresAt: now + 1000 * 60 * 60 * 22,
      durationLabel: '24 Hours',
      hasPassword: true,
      password: 'vanish123',
      downloadCount: 1,
      maxDownloads: 5,
      status: 'active',
      ownerEmail: 'dhairya@iiitv.ac.in',
      ownerName: 'Dhairya Desai',
      sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      isClientEncrypted: true,
      blobDataUrl: 'data:application/vnd.ms-excel;base64,UEsDBBQAAAAIAAAAAAAAAAAAAAAAAAAAAAA=',
      accessLogs: [
        {
          id: 'log-4',
          timestamp: now - 1000 * 60 * 45,
          action: 'unlocked',
          ipHash: 'sha256:5c7d...8e90',
          location: 'Bengaluru, Karnataka',
          clientSnippet: 'Edge 121 / Windows 10'
        },
        {
          id: 'log-5',
          timestamp: now - 1000 * 60 * 44,
          action: 'downloaded',
          ipHash: 'sha256:5c7d...8e90',
          location: 'Bengaluru, Karnataka',
          clientSnippet: 'Edge 121 / Windows 10'
        }
      ]
    },
    {
      id: 'demo-vanished',
      name: 'Temporary_API_Credentials.env',
      size: 840,
      mimeType: 'text/plain',
      uploadedAt: now - 1000 * 60 * 60 * 2,
      expiresAt: now - 1000 * 60 * 30, // Expired 30 mins ago
      durationLabel: '1 Hour',
      hasPassword: false,
      downloadCount: 2,
      maxDownloads: null,
      status: 'expired',
      ownerEmail: 'jatan@iiitv.ac.in',
      ownerName: 'Jatan Bhatt',
      sha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      isClientEncrypted: false,
      accessLogs: [
        {
          id: 'log-6',
          timestamp: now - 1000 * 60 * 95,
          action: 'downloaded',
          ipHash: 'sha256:4b22...19de',
          location: 'Mumbai, Maharashtra',
          clientSnippet: 'curl/8.4.0 (x86_64)'
        },
        {
          id: 'log-7',
          timestamp: now - 1000 * 60 * 30,
          action: 'expired',
          ipHash: 'system:janitor-worker',
          location: 'Cloudflare Worker (BOM-01)',
          clientSnippet: 'Vanish Janitor TTL Daemon'
        }
      ]
    },
    {
      id: 'demo-exhausted',
      name: 'Campus_Hackathon_Invite_VIP.png',
      size: 4320100, // 4.3 MB
      mimeType: 'image/png',
      uploadedAt: now - 1000 * 60 * 15,
      expiresAt: now + 1000 * 60 * 60 * 12,
      durationLabel: '24 Hours',
      hasPassword: false,
      downloadCount: 3,
      maxDownloads: 3, // Exhausted
      status: 'exhausted',
      ownerEmail: 'meet@iiitv.ac.in',
      ownerName: 'Meet Dhorajiya',
      sha256: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
      isClientEncrypted: true,
      blobDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="100%" height="100%" fill="%230f2752"/><text x="50%" y="50%" fill="%2360a5fa" font-size="24" font-family="sans-serif" text-anchor="middle">VANISH SECURE VIP PASS</text></svg>',
      accessLogs: [
        {
          id: 'log-8',
          timestamp: now - 1000 * 60 * 12,
          action: 'downloaded',
          ipHash: 'sha256:32ff...bb01',
          location: 'Gandhinagar, Gujarat',
          clientSnippet: 'Chrome 122 / Android 14'
        }
      ]
    },
    {
      id: 'demo-fast',
      name: 'Ephemeral_Secret_Key.txt',
      size: 128,
      mimeType: 'text/plain',
      uploadedAt: now - 1000 * 5,
      expiresAt: now + 1000 * 25, // 25s remaining
      durationLabel: '30s',
      hasPassword: false,
      downloadCount: 0,
      maxDownloads: 1,
      status: 'active',
      ownerEmail: 'dhairya@iiitv.ac.in',
      ownerName: 'Dhairya Desai',
      sha256: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
      isClientEncrypted: true,
      blobDataUrl: 'data:text/plain;base64,VkFOSVNIX1NFQ1JFVF9LRVk9ZTBhNzc5ZDE4YTYzOWIxZDAzYzFjYTU0MDYzNzNhZmIK',
      accessLogs: []
    }
  ];
}

// Synchronous Stored Files Cache
export function getStoredFiles(): FileRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = generateSeedFiles();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed: FileRecord[] = JSON.parse(raw);
    const now = Date.now();
    let hasChanges = false;
    parsed.forEach((f) => {
      if (f.status === 'active' && now > f.expiresAt) {
        f.status = 'expired';
        incrementScrubbedBytes(f.size);
        f.accessLogs.unshift({
          id: `log-exp-${Date.now()}`,
          timestamp: now,
          action: 'expired',
          ipHash: 'system:janitor-worker',
          location: 'Local TTL Watcher',
          clientSnippet: 'Automated Scrub Engine'
        });
        hasChanges = true;
      }
    });
    if (hasChanges) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return [];
  }
}

export function saveStoredFiles(files: FileRecord[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
  notifyAll();
}

export function addStoredFile(record: FileRecord): void {
  const current = getStoredFiles();
  const updated = [record, ...current];
  saveStoredFiles(updated);
}

export function getFileById(id: string): FileRecord | null {
  const files = getStoredFiles();
  return files.find((f) => f.id === id) || null;
}

export function verifyPasswordAndGet(id: string, passwordAttempt: string): { success: boolean; file?: FileRecord; error?: string } {
  const file = getFileById(id);
  if (!file) return { success: false, error: 'File not found' };
  if (!file.hasPassword) return { success: true, file };
  if (file.password === passwordAttempt) {
    file.accessLogs.unshift({
      id: `log-unlock-${Date.now()}`,
      timestamp: Date.now(),
      action: 'unlocked',
      ipHash: `sha256:${Math.random().toString(16).substring(2, 6)}...${Math.random().toString(16).substring(2, 6)}`,
      location: 'Verified Recipient',
      clientSnippet: typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 30) : 'Browser Client'
    });
    const files = getStoredFiles().map((f) => (f.id === id ? file : f));
    saveStoredFiles(files);
    return { success: true, file };
  }
  return { success: false, error: 'Incorrect password' };
}

export function recordDownloadAndCheckExpiry(id: string): { success: boolean; file?: FileRecord; error?: string } {
  const files = getStoredFiles();
  const index = files.findIndex((f) => f.id === id);
  if (index === -1) return { success: false, error: 'File not found' };
  const target = { ...files[index] };
  const now = Date.now();

  if (target.status !== 'active' || now > target.expiresAt) {
    target.status = 'expired';
    files[index] = target;
    saveStoredFiles(files);
    return { success: false, error: 'This file has already expired.' };
  }

  target.downloadCount += 1;
  const newLog: AccessLog = {
    id: `log-dl-${now}`,
    timestamp: now,
    action: 'downloaded',
    ipHash: `sha256:${Math.random().toString(16).substring(2, 6)}...${Math.random().toString(16).substring(2, 6)}`,
    location: 'Verified Recipient',
    clientSnippet: typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 30) : 'Browser Client'
  };
  target.accessLogs = [newLog, ...target.accessLogs];

  if (target.maxDownloads !== null && target.downloadCount >= target.maxDownloads) {
    target.status = 'exhausted';
  }

  files[index] = target;
  saveStoredFiles(files);
  return { success: true, file: target };
}

export function deleteFileImmediately(id: string): boolean {
  deleteFileApi(id).catch(() => {});
  const files = getStoredFiles();
  const target = files.find((f) => f.id === id);
  if (target) {
    incrementScrubbedBytes(target.size);
  }
  const updated = files.filter((f) => f.id !== id);
  saveStoredFiles(updated);
  return true;
}

export function resetDemoDatabase(): void {
  resetDatabaseApi().catch(() => {});
  if (typeof window === 'undefined') return;
  const fresh = generateSeedFiles();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  notifyAll();
}

// ---------------- Backend API Endpoints ----------------

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
      if (data.files && Array.isArray(data.files) && data.files.length > 0) {
        saveStoredFiles(data.files);
        return data.files;
      }
    }
  } catch (e) {
    console.warn('Backend fetch failed, using local cache', e);
  }
  return getStoredFiles();
}

export async function fetchFileById(id: string): Promise<FileRecord | null> {
  try {
    const res = await fetch(`/api/file/${id}`, { cache: 'no-store', credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      if (data.file) return data.file;
    }
  } catch (e) {
    console.warn('Backend fetchFileById failed, falling back to local cache', e);
  }
  return getFileById(id);
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

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      credentials: 'include',
      headers,
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.file) {
        addStoredFile(data.file);
        return data.file;
      }
    } else {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Server upload failed');
    }
  } catch (e: any) {
    console.warn('Backend upload failed, attempting local fallback', e);
    // Local fallback
    const id = generateSecureId(8);
    const now = Date.now();
    let ttlMs = 1000 * 60 * 60; // default 1h
    if (options.duration === '30s') ttlMs = 1000 * 30;
    else if (options.duration === '6h') ttlMs = 1000 * 60 * 60 * 6;
    else if (options.duration === '24h') ttlMs = 1000 * 60 * 60 * 24;
    else if (options.duration === '7d') ttlMs = 1000 * 60 * 60 * 24 * 7;

    const fallbackRecord: FileRecord = {
      id,
      name: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      uploadedAt: now,
      expiresAt: now + ttlMs,
      durationLabel: options.duration,
      hasPassword: Boolean(options.password),
      password: options.password,
      downloadCount: 0,
      maxDownloads: options.maxDownloads ?? null,
      status: 'active',
      ownerEmail: options.ownerEmail || user.email || 'user@vanish.app',
      ownerName: user.name || 'Anonymous',
      accessLogs: []
    };
    addStoredFile(fallbackRecord);
    return fallbackRecord;
  }

  throw new Error('Upload could not be processed');
}

export async function unlockFilePassword(id: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const res = await fetch(`/api/file/${id}/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();
    if (res.ok) {
      return { success: true, token: data.accessToken };
    }
  } catch {
    // fallback below
  }

  // Local fallback
  const localRes = verifyPasswordAndGet(id, password);
  if (localRes.success) {
    return { success: true, token: `local-token-${Date.now()}` };
  }
  return { success: false, error: localRes.error || 'Incorrect password' };
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
    return {
      isLoggedIn: true,
      name: 'Meet Dhorajiya',
      email: 'meet@iiitv.ac.in',
      studentId: '202451053'
    };
  }
  try {
    const raw = localStorage.getItem(AUTH_KEY) || localStorage.getItem(AUTH_KEY_LEGACY);
    if (!raw) {
      const defaultUser: UserSession = {
        isLoggedIn: true,
        name: 'Meet Dhorajiya',
        email: 'meet@iiitv.ac.in',
        studentId: '202451053',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMDI0NTEwNTMiLCJuYW1lIjoiTWVldCBEaG9yYWppeWEiLCJpYXQiOjE3Nzg4OTYwMDB9.signature'
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(defaultUser));
      return defaultUser;
    }
    return JSON.parse(raw);
  } catch {
    return {
      isLoggedIn: true,
      name: 'Meet Dhorajiya',
      email: 'meet@iiitv.ac.in',
      studentId: '202451053'
    };
  }
}

export function setMockUser(user: UserSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  if (user.token) {
    document.cookie = `auth_token=${encodeURIComponent(user.token)}; path=/; max-age=604800; SameSite=Lax`;
  }
  notifyAll();
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
    localStorage.removeItem(AUTH_KEY_LEGACY);
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    notifyAll();
  }
}

function incrementScrubbedBytes(bytes: number) {
  if (typeof window === 'undefined') return;
  try {
    const current = parseInt(localStorage.getItem(SCRUBBED_COUNTER_KEY) || '84920000', 10);
    localStorage.setItem(SCRUBBED_COUNTER_KEY, String(current + bytes));
  } catch {
    // Ignore
  }
}

export function getSystemMetrics(): SystemMetrics {
  const files = getStoredFiles();
  const totalActive = files.filter((f) => f.status === 'active').length;
  const totalVanished = files.filter((f) => f.status !== 'active').length;
  const totalDownloads = files.reduce((acc, f) => acc + f.downloadCount, 0);

  let totalBytesScrubbed = 94829000;
  if (typeof window !== 'undefined') {
    try {
      const val = localStorage.getItem(SCRUBBED_COUNTER_KEY);
      if (val) totalBytesScrubbed = parseInt(val, 10);
    } catch {
      // Ignore
    }
  }

  return {
    totalActive,
    totalVanished,
    totalDownloads,
    totalBytesScrubbed,
    clusterStatus: 'nominal',
    ttlEngineLagMs: 14
  };
}
