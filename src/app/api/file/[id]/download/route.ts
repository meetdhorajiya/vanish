import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { readDatabase, writeDatabase, getUploadsDirectory } from '@/server/db';
import { verifyJwt } from '@/server/crypto';


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = readDatabase();
    const file = db.files.find((f) => f.id === id);

    if (!file) {
      return NextResponse.json({ error: 'File not found or permanently vanished' }, { status: 404 });
    }

    // 1. Check TTL expiry
    if (file.status === 'expired' || Date.now() >= file.expiresAt) {
      file.status = 'expired';
      writeDatabase(db);
      return NextResponse.json({ error: 'File has expired and vanished' }, { status: 410 });
    }

    // 2. Check download limit
    if (file.status === 'exhausted' || (file.maxDownloads !== null && file.downloadCount >= file.maxDownloads)) {
      file.status = 'exhausted';
      writeDatabase(db);
      return NextResponse.json({ error: 'Download quota has been exhausted' }, { status: 410 });
    }

    // 3. Check password protection if enabled
    if (file.hasPassword) {
      const authHeader = req.headers.get('authorization') || '';
      const queryToken = req.nextUrl.searchParams.get('token') || '';
      const token = authHeader.replace(/^Bearer\s+/i, '') || queryToken;

      const verification = verifyJwt(token);
      if (!verification.valid || verification.payload?.fileId !== id) {
        return NextResponse.json({ error: 'Password authentication required' }, { status: 401 });
      }
    }

    // 4. Locate physical file on disk
    const uploadsDir = getUploadsDirectory();
    const physicalPath = path.join(uploadsDir, file.diskFileName);

    if (!fs.existsSync(physicalPath)) {
      file.status = 'expired';
      writeDatabase(db);
      return NextResponse.json({ error: 'File binary expunged from cloud storage' }, { status: 410 });
    }

    const fileBuffer = fs.readFileSync(physicalPath);

    // 5. Increment download counter
    file.downloadCount += 1;

    // 6. Enforce auto-destruct if download quota reached
    if (file.maxDownloads !== null && file.downloadCount >= file.maxDownloads) {
      file.status = 'exhausted';
      try {
        fs.unlinkSync(physicalPath);
        console.log(`[Vanish Quota Auto-Destruct] File reached download limit (${file.maxDownloads}): ${file.name}`);
      } catch (e) {
        console.error('Error auto-destructing exhausted file:', e);
      }
    }

    writeDatabase(db);

    const safeFileName = encodeURIComponent(file.name);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': file.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${safeFileName}"; filename*=UTF-8''${safeFileName}`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err) {
    console.error('File download API error:', err);
    return NextResponse.json({ error: 'Failed to process file download' }, { status: 500 });
  }
}
