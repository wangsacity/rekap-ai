import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET: Ambil semua prospek (untuk dashboard)
export async function GET() {
  try {
    const db = await getDb();
    const { rows } = await db.query(
      'SELECT * FROM prospects ORDER BY "skorPrioritas" DESC, id DESC'
    );

    return NextResponse.json({ success: true, data: rows });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[prospects GET] error:', msg);
    return NextResponse.json({ success: false, error: msg, data: [] }, { status: 500 });
  }
}

// POST: Simpan satu rekap prospek ke MySQL/PostgreSQL
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const db = await getDb();
    const { rows } = await db.query(
      `INSERT INTO prospects (
        "tanggalRekap", "namaSales", "namaCust", "noHP", alamat,
        "penghasilanEstimasi", "produkDiminati", urgensi, status,
        "skorPrioritas", "catatanAI", "namaFile", "masalahCustomer", "catatanSales"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id`,
      [
        body.tanggalRekap ?? '',
        body.namaSales ?? '',
        body.namaCust ?? '',
        body.noHP ?? '',
        body.alamat ?? '',
        body.penghasilanEstimasi ?? '',
        body.produkDiminati ?? '',
        body.urgensi ?? '',
        body.status ?? 'Cold',
        body.skorPrioritas ?? 5,
        body.catatanAI ?? '',
        body.namaFile ?? '',
        body.masalahCustomer ?? '',
        body.catatanSales ?? '',
      ]
    );

    return NextResponse.json({
      success: true,
      id: rows[0].id,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[prospects POST] error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// DELETE: Hapus prospek berdasarkan id
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID prospek wajib diisi' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const result = await db.query('DELETE FROM prospects WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Prospek tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[prospects DELETE] error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
