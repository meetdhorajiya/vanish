import { NextResponse } from 'next/server';
import { readDatabase, purgeExpiredFiles } from '@/server/db';
import '@/server/cleanup';


export async function GET() {
  try {
    purgeExpiredFiles();
    const db = readDatabase();

    const sanitizedFiles = db.files.map((file) => ({
      id: file.id,
      name: file.name,
      size: file.size,
      mimeType: file.mimeType,
      uploadedAt: file.uploadedAt,
      expiresAt: file.expiresAt,
      durationLabel: file.durationLabel,
      hasPassword: file.hasPassword,
      downloadCount: file.downloadCount,
      maxDownloads: file.maxDownloads,
      status: file.status,
      ownerEmail: file.ownerEmail,
    }));

    return NextResponse.json({
      success: true,
      files: sanitizedFiles,
    });
  } catch (err) {
    console.error('List files API error:', err);
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
  }
}
