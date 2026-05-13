import { NextRequest, NextResponse } from 'next/server';

const SHEETS_URL = process.env.GOOGLE_SHEETS_URL;

// POST: Kirim satu rekap ke Google Sheets
// Urutan kolom: tanggalRekap, namaSales, namaCust, noHP, alamat,
// penghasilanEstimasi, produkDiminati, urgensi, status, skorPrioritas, catatanAI, namaFile
export async function POST(request: NextRequest) {
  try {
    if (!SHEETS_URL) {
      return NextResponse.json(
        { success: false, error: 'GOOGLE_SHEETS_URL belum dikonfigurasi di .env' },
        { status: 500 }
      );
    }

    const body = await request.json();

    // Kirim sebagai array terurut agar kolom di Google Sheets PASTI benar
    // Urutan: A-N (14 kolom)
    const rowData = [
      body.tanggalRekap ?? '',       // A: tanggalRekap
      body.namaSales ?? '',          // B: namaSales
      body.namaCust ?? '',           // C: namaCust
      body.noHP ?? '',               // D: noHP
      body.alamat ?? '',             // E: alamat
      body.penghasilanEstimasi ?? '',// F: penghasilanEstimasi
      body.produkDiminati ?? '',     // G: produkDiminati
      body.urgensi ?? '',            // H: urgensi
      body.status ?? '',             // I: status
      body.skorPrioritas ?? '',      // J: skorPrioritas
      body.catatanAI ?? '',          // K: catatanAI
      body.namaFile ?? '',           // L: namaFile
      body.masalahCustomer ?? '',    // M: masalahCustomer
      body.catatanSales ?? '',       // N: catatanSales
    ];

    const res = await fetch(SHEETS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(rowData),
      redirect: 'follow',
    });

    const text = await res.text();
    console.log('[sheets POST] status:', res.status, 'body:', text);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    try {
      const json = JSON.parse(text);
      if (json.success === false) throw new Error(json.error || 'Apps Script error');
    } catch {
      if (!res.ok) throw new Error(text.slice(0, 200));
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[sheets POST] error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// GET: Ambil semua data dari Google Sheets
export async function GET() {
  try {
    if (!SHEETS_URL) {
      return NextResponse.json(
        { success: false, error: 'GOOGLE_SHEETS_URL belum dikonfigurasi', data: [] },
        { status: 200 }
      );
    }

    const res = await fetch(`${SHEETS_URL}?action=get`, {
      cache: 'no-store',
      redirect: 'follow',
    });

    const text = await res.text();
    console.log('[sheets GET] status:', res.status, 'preview:', text.slice(0, 100));

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const raw = JSON.parse(text);
    return NextResponse.json({ success: true, data: Array.isArray(raw) ? raw : [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[sheets GET] error:', msg);
    return NextResponse.json({ success: false, error: msg, data: [] }, { status: 500 });
  }
}
