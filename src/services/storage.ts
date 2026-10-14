'use client';

import { FileRecord, UserSession, SystemMetrics, AccessLog } from '@/types';
import { generateSecureId } from './crypto';

const STORAGE_KEY = 'vanish_files_db_v2';
const AUTH_KEY = 'vanish_user_session_v2';
const SCRUBBED_COUNTER_KEY = 'vanish_total_scrubbed_bytes_v2';

// In-memory subscribers for instant live reactivity across components
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
let broadcastChannel: BroadcastChannel | null = null;
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

function notifyAll() {
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

// Seed Initial Data with rich simulated access logs and realistic content
function generateSeedFiles(): FileRecord[] {
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
        },
        {
          id: 'log-9',
          timestamp: now - 1000 * 60 * 9,
          action: 'downloaded',
          ipHash: 'sha256:99ac...dd44',
          location: 'Vadodara, Gujarat',
          clientSnippet: 'Safari 17 / iPadOS'
        },
        {
          id: 'log-10',
          timestamp: now - 1000 * 60 * 2,
          action: 'burned',
          ipHash: 'system:quota-guard',
          location: 'AWS ap-south-1 (Mumbai)',
          clientSnippet: 'Vanish Quota Guard (Max Downloads Limit 3/3 Reached)'
        }
      ]
    },
    {
      id: 'demo-fast',
      name: 'Quick_Self_Destruct_Demo.txt',
      size: 2048,
      mimeType: 'text/plain',
      uploadedAt: now,
      expiresAt: now + 1000 * 45, // 45 seconds demo
      durationLabel: '45s Demo',
      hasPassword: false,
      downloadCount: 0,
      maxDownloads: 2,
      status: 'active',
      ownerEmail: 'meet@iiitv.ac.in',
      ownerName: 'Meet Dhorajiya',
      sha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
      isClientEncrypted: false,
      blobDataUrl: 'data:text/plain;charset=utf-8,This%20file%20was%20ephemerally%20shared%20via%20Vanish.%20It%20will%20self-destruct%20shortly!',
      accessLogs: [
        {
          id: 'log-11',
          timestamp: now,
          action: 'viewed',
          ipHash: 'sha256:local...preview',
          location: 'Local Session',
          clientSnippet: 'Next.js 16 Preview'
        }
      ]
    }
  ];
}

export function getStoredFiles(): FileRecord[] {
  if (typeof window === 'undefined') {
    return generateSeedFiles();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeds = generateSeedFiles();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeds));
      return seeds;
    }
    const files: FileRecord[] = JSON.parse(raw);

    // Dynamic TTL check
    const now = Date.now();
    let hasChanges = false;

    const checked = files.map((file) => {
      if (file.status === 'active') {
        if (now >= file.expiresAt) {
          hasChanges = true;
          // Add scrubbed bytes to metric
          incrementScrubbedBytes(file.size);
          return {
            ...file,
            status: 'expired' as const,
            accessLogs: [
              {
                id: `log-exp-${Date.now()}`,
                timestamp: now,
                action: 'expired' as const,
                ipHash: 'system:ttl-janitor',
                location: 'Vanish Cloud Edge Worker',
                clientSnippet: 'Automated TTL Cron Expunged Payload'
              },
              ...file.accessLogs
            ]
          };
        }
        if (file.maxDownloads !== null && file.downloadCount >= file.maxDownloads) {
          hasChanges = true;
          return {
            ...file,
            status: 'exhausted' as const,
            accessLogs: [
              {
                id: `log-exh-${Date.now()}`,
                timestamp: now,
                action: 'burned' as const,
                ipHash: 'system:quota-enforcer',
                location: 'Vanish Security Guard',
                clientSnippet: 'Maximum Download Quota Exhausted'
              },
              ...file.accessLogs
            ]
          };
        }
      }
      return file;
    });

    if (hasChanges) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
      notifyAll();
    }

    return checked;
  } catch (err) {
    console.error('Failed reading files from storage', err);
    return generateSeedFiles();
  }
}

export function saveStoredFiles(files: FileRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
    notifyAll();
  } catch (err) {
    console.error('Failed saving files to storage', err);
  }
}

export function getFileById(id: string): FileRecord | null {
  const files = getStoredFiles();
  return files.find((f) => f.id === id) || null;
}

export function saveNewFile(
  file: Omit<FileRecord, 'id' | 'uploadedAt' | 'downloadCount' | 'status' | 'accessLogs'>
): FileRecord {
  const files = getStoredFiles();
  const randId = generateSecureId(7);
  const now = Date.now();

  const record: FileRecord = {
    ...file,
    id: randId,
    uploadedAt: now,
    downloadCount: 0,
    status: 'active',
    accessLogs: [
      {
        id: `log-init-${now}`,
        timestamp: now,
        action: 'viewed',
        ipHash: 'sha256:origin...author',
        location: 'Vadodara, IN',
        clientSnippet: 'Vanish Upload Studio (AES-256 Verified)'
      }
    ]
  };

  const updated = [record, ...files];
  saveStoredFiles(updated);
  return record;
}

export function recordFileDownload(id: string): { success: boolean; file: FileRecord | null; error?: string } {
  const files = getStoredFiles();
  const index = files.findIndex((f) => f.id === id);
  if (index === -1) {
    return { success: false, file: null, error: 'File was permanently destroyed or not found' };
  }

  const target = { ...files[index] };
  const now = Date.now();

  if (now >= target.expiresAt) {
    target.status = 'expired';
    files[index] = target;
    saveStoredFiles(files);
    return { success: false, file: target, error: 'TTL lifetime elapsed. File has vanished.' };
  }

  if (target.maxDownloads !== null && target.downloadCount >= target.maxDownloads) {
    target.status = 'exhausted';
    files[index] = target;
    saveStoredFiles(files);
    return { success: false, file: target, error: 'Maximum download quota exhausted.' };
  }

  target.downloadCount += 1;

  // Add download log
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
  if (typeof window === 'undefined') return;
  const fresh = generateSeedFiles();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  notifyAll();
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
    const raw = localStorage.getItem(AUTH_KEY);
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
  notifyAll();
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

  let totalBytesScrubbed = 94829000; // ~94.8 MB base simulation
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
