import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET: Ambil semua users (tanpa password)
export async function GET() {
  try {
    const db = await getDb();
    const { rows } = await db.query('SELECT id, username, nama, role FROM users ORDER BY id');
    return NextResponse.json({ success: true, users: rows });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[auth/users GET] error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST: Buat user baru
export async function POST(request: NextRequest) {
  try {
    const { username, password, nama, role } = await request.json();

    if (!username?.trim() || !password?.trim() || !nama?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Semua field wajib diisi' },
        { status: 400 }
      );
    }

    if (!['admin', 'sales'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Role tidak valid' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const existing = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.rowCount && existing.rowCount > 0) {
      return NextResponse.json(
        { success: false, error: 'Username sudah digunakan' },
        { status: 409 }
      );
    }

    const id = `user-${Date.now()}`;
    await db.query(
      'INSERT INTO users (id, username, password, nama, role) VALUES ($1, $2, $3, $4, $5)',
      [id, username, password, nama, role]
    );

    return NextResponse.json({
      success: true,
      user: { id, username, nama, role },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[auth/users POST] error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// DELETE: Hapus user berdasarkan id (via query param ?id=xxx)
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID user wajib diisi' },
        { status: 400 }
      );
    }

    if (id === 'admin-001') {
      return NextResponse.json(
        { success: false, error: 'Tidak bisa menghapus admin default' },
        { status: 403 }
      );
    }

    const db = await getDb();
    const result = await db.query('DELETE FROM users WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[auth/users DELETE] error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
