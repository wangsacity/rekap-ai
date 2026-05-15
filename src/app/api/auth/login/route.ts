import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username?.trim() || !password?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Username dan password wajib diisi' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const { rows } = await db.query(
      'SELECT id, username, nama, role FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );

    const users = rows;
    if (users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Username atau password salah' },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, user: users[0] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[auth/login] error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
