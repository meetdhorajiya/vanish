import { NextResponse } from 'next/server';
import { readDatabase } from '@/server/db';
import '@/server/cleanup';


export async function GET() {
  try {
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

    return NextResponse.json(
      { success: true, files: sanitizedFiles },
      {
        headers: {
          // Serve stale immediately, revalidate in background – dashboard polls every 5s anyway
          'Cache-Control': 'no-cache, stale-while-revalidate=4',
        },
      }
    );
  } catch (err) {
    console.error('List files API error:', err);
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
  }
}
