'use client';

import { FileRecord, UserSession } from '@/types';

const STORAGE_KEY = 'vanish_files_db_v1';
const AUTH_KEY = 'vanish_user_session_v1';

const DEFAULT_SEEDS: FileRecord[] = [
  {
    id: 'demo-active',
    name: 'IIITV_Design_Project_Report.pdf',
    size: 2457600, // ~2.4 MB
    mimeType: 'application/pdf',
    uploadedAt: Date.now() - 1000 * 60 * 35, // 35 minutes ago
    expiresAt: Date.now() + 1000 * 60 * 60 * 5, // 5 hours from now
    durationLabel: '6 Hours',
    hasPassword: false,
    downloadCount: 3,
    maxDownloads: 10,
    status: 'active',
    ownerEmail: 'meet@iiitv.ac.in',
  },
  {
    id: 'demo-locked',
    name: 'Confidential_Financial_Audit_2026.xlsx',
    size: 1548200, // ~1.5 MB
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    uploadedAt: Date.now() - 1000 * 60 * 90,
    expiresAt: Date.now() + 1000 * 60 * 60 * 22, // 22 hours from now
    durationLabel: '24 Hours',
    hasPassword: true,
    password: 'vanish123',
    downloadCount: 1,
    maxDownloads: 5,
    status: 'active',
    ownerEmail: 'dhairya@iiitv.ac.in',
  },
  {
    id: 'demo-vanished',
    name: 'Temporary_API_Credentials.env',
    size: 840, // 840 bytes
    mimeType: 'text/plain',
    uploadedAt: Date.now() - 1000 * 60 * 60 * 2,
    expiresAt: Date.now() - 1000 * 60 * 30, // expired 30 mins ago
    durationLabel: '1 Hour',
    hasPassword: false,
    downloadCount: 2,
    maxDownloads: null,
    status: 'expired',
    ownerEmail: 'jatan@iiitv.ac.in',
  },
  {
    id: 'demo-exhausted',
    name: 'Campus_Hackathon_Invite_VIP.png',
    size: 4320100, // ~4.3 MB
    mimeType: 'image/png',
    uploadedAt: Date.now() - 1000 * 60 * 15,
    expiresAt: Date.now() + 1000 * 60 * 60 * 12,
    durationLabel: '24 Hours',
    hasPassword: false,
    downloadCount: 3,
    maxDownloads: 3, // exhausted!
    status: 'exhausted',
    ownerEmail: 'meet@iiitv.ac.in',
  },
  {
    id: 'demo-fast',
    name: 'Quick_Self_Destruct_Demo.txt',
    size: 2048,
    mimeType: 'text/plain',
    uploadedAt: Date.now(),
    expiresAt: Date.now() + 1000 * 30, // 30 seconds
    durationLabel: '30s Demo',
    hasPassword: false,
    downloadCount: 0,
    maxDownloads: 1,
    status: 'active',
    ownerEmail: 'meet@iiitv.ac.in',
  }
];

export function getStoredFiles(): FileRecord[] {
  if (typeof window === 'undefined') return DEFAULT_SEEDS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SEEDS));
      return DEFAULT_SEEDS;
    }
    const files: FileRecord[] = JSON.parse(raw);
    
    // Auto-update statuses based on live clock
    const now = Date.now();
    return files.map((file) => {
      if (file.status === 'active') {
        if (now >= file.expiresAt) {
          return { ...file, status: 'expired' };
        }
        if (file.maxDownloads !== null && file.downloadCount >= file.maxDownloads) {
          return { ...file, status: 'exhausted' };
        }
      }
      return file;
    });
  } catch (err) {
    console.error('Failed reading files from localStorage', err);
    return DEFAULT_SEEDS;
  }
}

export function saveStoredFiles(files: FileRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
  } catch (err) {
    console.error('Failed writing files to localStorage', err);
  }
}

export function getFileById(id: string): FileRecord | null {
  const files = getStoredFiles();
  return files.find((f) => f.id === id) || null;
}

export function saveNewFile(file: Omit<FileRecord, 'id' | 'uploadedAt' | 'downloadCount' | 'status'>): FileRecord {
  const files = getStoredFiles();
  // Generate random non-guessable 6-8 char ID matching report specification (e.g. vanish.app/f/x7Yq2P)
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randId = '';
  for (let i = 0; i < 7; i++) {
    randId += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const record: FileRecord = {
    ...file,
    id: randId,
    uploadedAt: Date.now(),
    downloadCount: 0,
    status: 'active',
  };

  const updated = [record, ...files];
  saveStoredFiles(updated);
  return record;
}

export function recordFileDownload(id: string): { success: boolean; file: FileRecord | null; error?: string } {
  const files = getStoredFiles();
  const index = files.findIndex((f) => f.id === id);
  if (index === -1) {
    return { success: false, file: null, error: 'File not found' };
  }

  const target = files[index];
  if (Date.now() >= target.expiresAt) {
    target.status = 'expired';
    saveStoredFiles(files);
    return { success: false, file: target, error: 'File has expired and vanished' };
  }

  if (target.maxDownloads !== null && target.downloadCount >= target.maxDownloads) {
    target.status = 'exhausted';
    saveStoredFiles(files);
    return { success: false, file: target, error: 'Download limit has been reached' };
  }

  target.downloadCount += 1;
  if (target.maxDownloads !== null && target.downloadCount >= target.maxDownloads) {
    target.status = 'exhausted';
  }

  saveStoredFiles(files);
  return { success: true, file: target };
}

export function deleteFileImmediately(id: string): boolean {
  const files = getStoredFiles();
  const updated = files.filter((f) => f.id !== id);
  saveStoredFiles(updated);
  return true;
}

export function resetDemoDatabase(): void {
  if (typeof window === 'undefined') return;
  // Reset seeds with fresh timestamps
  const freshSeeds: FileRecord[] = [
    {
      id: 'demo-active',
      name: 'IIITV_Design_Project_Report.pdf',
      size: 2457600,
      mimeType: 'application/pdf',
      uploadedAt: Date.now() - 1000 * 60 * 35,
      expiresAt: Date.now() + 1000 * 60 * 60 * 5,
      durationLabel: '6 Hours',
      hasPassword: false,
      downloadCount: 3,
      maxDownloads: 10,
      status: 'active',
      ownerEmail: 'meet@iiitv.ac.in',
    },
    {
      id: 'demo-locked',
      name: 'Confidential_Financial_Audit_2026.xlsx',
      size: 1548200,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      uploadedAt: Date.now() - 1000 * 60 * 90,
      expiresAt: Date.now() + 1000 * 60 * 60 * 22,
      durationLabel: '24 Hours',
      hasPassword: true,
      password: 'vanish123',
      downloadCount: 1,
      maxDownloads: 5,
      status: 'active',
      ownerEmail: 'dhairya@iiitv.ac.in',
    },
    {
      id: 'demo-vanished',
      name: 'Temporary_API_Credentials.env',
      size: 840,
      mimeType: 'text/plain',
      uploadedAt: Date.now() - 1000 * 60 * 60 * 2,
      expiresAt: Date.now() - 1000 * 60 * 30,
      durationLabel: '1 Hour',
      hasPassword: false,
      downloadCount: 2,
      maxDownloads: null,
      status: 'expired',
      ownerEmail: 'jatan@iiitv.ac.in',
    },
    {
      id: 'demo-exhausted',
      name: 'Campus_Hackathon_Invite_VIP.png',
      size: 4320100,
      mimeType: 'image/png',
      uploadedAt: Date.now() - 1000 * 60 * 15,
      expiresAt: Date.now() + 1000 * 60 * 60 * 12,
      durationLabel: '24 Hours',
      hasPassword: false,
      downloadCount: 3,
      maxDownloads: 3,
      status: 'exhausted',
      ownerEmail: 'meet@iiitv.ac.in',
    },
    {
      id: 'demo-fast',
      name: 'Quick_Self_Destruct_Demo.txt',
      size: 2048,
      mimeType: 'text/plain',
      uploadedAt: Date.now(),
      expiresAt: Date.now() + 1000 * 45, // 45 seconds from reset
      durationLabel: '45s Demo',
      hasPassword: false,
      downloadCount: 0,
      maxDownloads: 1,
      status: 'active',
      ownerEmail: 'meet@iiitv.ac.in',
    }
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(freshSeeds));
}

export function getCurrentUser(): UserSession {
  if (typeof window === 'undefined') {
    return { isLoggedIn: true, name: 'Meet Dhorajiya', email: 'meet@iiitv.ac.in' };
  }
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) {
      const defaultUser: UserSession = {
        isLoggedIn: true,
        name: 'Meet Dhorajiya',
        email: 'meet@iiitv.ac.in',
        token: 'mock-jwt-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMDI0NTEwNTMiLCJuYW1lIjoiTWVldCBEaG9yYWppeWEiLCJpYXQiOjE3Mzg4MDAwMDB9'
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(defaultUser));
      return defaultUser;
    }
    return JSON.parse(raw);
  } catch {
    return { isLoggedIn: true, name: 'Meet Dhorajiya', email: 'meet@iiitv.ac.in' };
  }
}

export function setMockUser(user: UserSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}
