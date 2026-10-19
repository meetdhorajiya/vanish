import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { readDatabase, writeDatabase, getUploadsDirectory, purgeExpiredFiles } from '@/server/db';


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    purgeExpiredFiles();

    const db = readDatabase();
    const file = db.files.find((f) => f.id === id);

    if (!file) {
      return NextResponse.json({ error: 'File not found or permanently vanished', status: 'expired' }, { status: 404 });
    }

    if (file.status === 'expired' || Date.now() >= file.expiresAt) {
      return NextResponse.json({
        file: {
          id: file.id,
          name: file.name,
          size: file.size,
          status: 'expired',
          expiresAt: file.expiresAt,
        },
      });
    }

    if (file.status === 'exhausted' || (file.maxDownloads !== null && file.downloadCount >= file.maxDownloads)) {
      return NextResponse.json({
        file: {
          id: file.id,
          name: file.name,
          size: file.size,
          status: 'exhausted',
          downloadCount: file.downloadCount,
          maxDownloads: file.maxDownloads,
        },
      });
    }

    return NextResponse.json({
      file: {
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
      },
    });
  } catch (err) {
    console.error('File metadata API error:', err);
    return NextResponse.json({ error: 'Failed to retrieve file metadata' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = readDatabase();
    const fileIndex = db.files.findIndex((f) => f.id === id);

    if (fileIndex === -1) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const file = db.files[fileIndex];

    // Physically delete file from disk storage
    const physicalPath = path.join(getUploadsDirectory(), file.diskFileName);
    if (fs.existsSync(physicalPath)) {
      try {
        fs.unlinkSync(physicalPath);
      } catch (e) {
        console.error('Error unlinking file on delete:', e);
      }
    }

    // Remove from database
    db.files.splice(fileIndex, 1);
    writeDatabase(db);

    console.log(`[Vanish Revoke API] File permanently deleted: ${file.name} (ID: ${id})`);

    return NextResponse.json({
      success: true,
      message: 'File and metadata expunged with zero trace',
    });
  } catch (err) {
    console.error('File delete API error:', err);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
