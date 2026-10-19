import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { generateSecureId, hashPassword } from '@/server/crypto';
import { readDatabase, writeDatabase, getUploadsDirectory, StoredFile } from '@/server/db';


const DURATION_MAP: Record<string, { ms: number; label: string }> = {
  '30s': { ms: 1000 * 30, label: '30s Demo' },
  '45s': { ms: 1000 * 45, label: '45s Demo' },
  '1h': { ms: 1000 * 60 * 60, label: '1 Hour' },
  '6h': { ms: 1000 * 60 * 60 * 6, label: '6 Hours' },
  '24h': { ms: 1000 * 60 * 60 * 24, label: '24 Hours' },
  '7d': { ms: 1000 * 60 * 60 * 24 * 7, label: '7 Days' },
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const durationKey = (formData.get('duration') as string) || '24h';
    const password = (formData.get('password') as string) || '';
    const maxDownloadsRaw = formData.get('maxDownloads') as string | null;
    const ownerEmail = (formData.get('ownerEmail') as string) || 'user@vanish.dev';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // MIME type & file security check
    const forbiddenExtensions = ['.exe', '.bat', '.cmd', '.sh', '.msi', '.vbs'];
    const lowerName = file.name.toLowerCase();
    if (forbiddenExtensions.some((ext) => lowerName.endsWith(ext))) {
      return NextResponse.json({ error: 'Executable files are prohibited for security' }, { status: 400 });
    }

    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: 'File exceeds 100MB maximum limit' }, { status: 400 });
    }

    const durationInfo = DURATION_MAP[durationKey] || DURATION_MAP['24h'];
    const id = generateSecureId();
    const diskFileName = `${id}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const destinationPath = path.join(getUploadsDirectory(), diskFileName);

    // Write file binary to disk storage
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(destinationPath, buffer);

    let passwordHash: string | undefined;
    let passwordSalt: string | undefined;
    const hasPassword = Boolean(password && password.trim().length > 0);

    if (hasPassword) {
      const hashed = hashPassword(password.trim());
      passwordHash = hashed.hash;
      passwordSalt = hashed.salt;
    }

    const maxDownloads = maxDownloadsRaw ? parseInt(maxDownloadsRaw, 10) : null;

    const newRecord: StoredFile = {
      id,
      name: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      diskFileName,
      uploadedAt: Date.now(),
      expiresAt: Date.now() + durationInfo.ms,
      durationLabel: durationInfo.label,
      hasPassword,
      passwordHash,
      passwordSalt,
      downloadCount: 0,
      maxDownloads: maxDownloads && !isNaN(maxDownloads) && maxDownloads > 0 ? maxDownloads : null,
      status: 'active',
      ownerEmail,
    };

    const db = readDatabase();
    db.files.unshift(newRecord);
    writeDatabase(db);

    console.log(`[Vanish Upload API] File uploaded successfully: ${file.name} (ID: ${id})`);

    // Return sanitized metadata
    return NextResponse.json({
      success: true,
      file: {
        id: newRecord.id,
        name: newRecord.name,
        size: newRecord.size,
        mimeType: newRecord.mimeType,
        uploadedAt: newRecord.uploadedAt,
        expiresAt: newRecord.expiresAt,
        durationLabel: newRecord.durationLabel,
        hasPassword: newRecord.hasPassword,
        downloadCount: newRecord.downloadCount,
        maxDownloads: newRecord.maxDownloads,
        status: newRecord.status,
        ownerEmail: newRecord.ownerEmail,
      },
    });
  } catch (err: unknown) {
    console.error('Upload API error:', err);
    return NextResponse.json({ error: 'Internal server error processing upload' }, { status: 500 });
  }
}
