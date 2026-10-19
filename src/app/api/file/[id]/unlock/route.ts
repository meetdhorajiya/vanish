import { NextRequest, NextResponse } from 'next/server';
import { readDatabase } from '@/server/db';
import { verifyPassword, signJwt } from '@/server/crypto';


export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const password = body.password || '';

    const db = readDatabase();
    const file = db.files.find((f) => f.id === id);

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    if (!file.hasPassword) {
      return NextResponse.json({ success: true, message: 'No password required' });
    }

    if (!file.passwordHash || !file.passwordSalt) {
      return NextResponse.json({ success: true });
    }

    const isValid = verifyPassword(password, file.passwordSalt, file.passwordHash);

    if (!isValid) {
      return NextResponse.json({ error: 'Incorrect access password' }, { status: 401 });
    }

    // Generate time-limited signed unlock token
    const token = signJwt({ fileId: id, purpose: 'download_access' }, 3600);

    return NextResponse.json({
      success: true,
      message: 'Access granted',
      accessToken: token,
    });
  } catch (err) {
    console.error('File unlock API error:', err);
    return NextResponse.json({ error: 'Unlock verification failed' }, { status: 500 });
  }
}
