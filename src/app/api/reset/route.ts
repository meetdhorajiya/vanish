import { NextResponse } from 'next/server';
import { resetDatabase } from '@/server/db';


export async function POST() {
  try {
    const data = resetDatabase();
    return NextResponse.json({
      success: true,
      message: 'Demo database and binary files reset successfully',
      fileCount: data.files.length,
    });
  } catch (err) {
    console.error('Reset database error:', err);
    return NextResponse.json({ error: 'Failed to reset database' }, { status: 500 });
  }
}
