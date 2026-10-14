export type ExpiryDuration = '30s' | '1h' | '6h' | '24h' | '7d';

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
  blobUrl?: string;
}

export interface UserSession {
  isLoggedIn: boolean;
  name: string;
  email: string;
  token?: string;
}
