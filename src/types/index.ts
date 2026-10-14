export type ExpiryDuration = '30s' | '1h' | '6h' | '24h' | '7d';

export interface AccessLog {
  id: string;
  timestamp: number;
  action: 'viewed' | 'unlocked' | 'downloaded' | 'expired' | 'burned';
  ipHash: string;
  location: string;
  clientSnippet: string;
}

export interface FileRecord {
  id: string;
  name: string;
  size: number; // in bytes
  mimeType: string;
  uploadedAt: number; // timestamp
  expiresAt: number; // timestamp
  durationLabel: string;
  hasPassword: boolean;
  password?: string;
  downloadCount: number;
  maxDownloads: number | null; // null = unlimited
  status: 'active' | 'expired' | 'exhausted';
  ownerEmail?: string;
  ownerName?: string;
  sha256?: string;
  isClientEncrypted?: boolean;
  encryptionSalt?: string;
  encryptionIv?: string;
  blobDataUrl?: string; // stored data url or blob cache key
  accessLogs: AccessLog[];
}

export interface UserSession {
  isLoggedIn: boolean;
  name: string;
  email: string;
  studentId?: string;
  token?: string;
}

export interface SystemMetrics {
  totalActive: number;
  totalVanished: number;
  totalDownloads: number;
  totalBytesScrubbed: number;
  clusterStatus: 'nominal' | 'degraded' | 'syncing';
  ttlEngineLagMs: number;
}
