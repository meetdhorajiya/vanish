'use client';

/**
 * VANISH Cryptographic Engine
 * Production-grade Web Crypto API implementation:
 * - End-to-end client-side AES-256-GCM encryption & decryption
 * - SHA-256 file checksum calculation for zero-trust integrity verification
 * - PBKDF2 key derivation for password protection
 * - High-entropy URL identifier generation
 */

// Generate a random cryptographically secure token
export function generateSecureId(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const array = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
    return Array.from(array).map((x) => chars[x % chars.length]).join('');
  }
  return Math.random().toString(36).substring(2, 2 + length);
}

// Compute SHA-256 checksum of any File or Blob
export async function computeSHA256(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Derive AES key from password using PBKDF2
async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt File Blob using AES-256-GCM
export async function encryptFileBlob(
  fileBlob: Blob,
  secretKeyOrPassword: string
): Promise<{
  encryptedBlob: Blob;
  saltHex: string;
  ivHex: string;
}> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKeyFromPassword(secretKeyOrPassword, salt);

  const fileData = await fileBlob.arrayBuffer();
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    fileData
  );

  const toHex = (buf: Uint8Array) => Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('');

  return {
    encryptedBlob: new Blob([encryptedBuffer], { type: 'application/octet-stream' }),
    saltHex: toHex(salt),
    ivHex: toHex(iv),
  };
}

// Decrypt File Blob using AES-256-GCM
export async function decryptFileBlob(
  encryptedBlob: Blob,
  secretKeyOrPassword: string,
  saltHex: string,
  ivHex: string,
  originalMimeType: string
): Promise<Blob> {
  const fromHex = (hex: string) => new Uint8Array(hex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []);
  const salt = fromHex(saltHex);
  const iv = fromHex(ivHex);

  const key = await deriveKeyFromPassword(secretKeyOrPassword, salt);
  const encryptedBuffer = await encryptedBlob.arrayBuffer();

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedBuffer
  );

  return new Blob([decryptedBuffer], { type: originalMimeType || 'application/octet-stream' });
}

// Format bytes into human readable format
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
