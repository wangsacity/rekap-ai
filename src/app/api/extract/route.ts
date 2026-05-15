import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { HttpsProxyAgent } from 'https-proxy-agent';

// Bypass firewall kantor:
// Opsi 1 (recommended): GROQ_BASE_URL = URL Cloudflare Worker proxy
// Opsi 2: PROXY_URL = HTTP/SOCKS proxy tradisional
const proxyUrl = process.env.NEXT_PUBLIC_PROXY_URL;
const baseURL = process.env.NEXT_PUBLIC_GROQ_BASE_URL; // contoh: https://groq-proxy.USERNAME.workers.dev/openai/v1

const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
  ...(baseURL ? { baseURL } : {}),
  ...(proxyUrl && !baseURL ? { httpAgent: new HttpsProxyAgent(proxyUrl) } : {}),
});

const PROMPT = `Kamu adalah AI analis sales properti Indonesia yang sangat handal.
Analisis percakapan WhatsApp di bawah ini dan extract informasi prospek secara detail dan akurat.

Berikan output HANYA berupa JSON valid (tanpa teks lain) dengan TEPAT format berikut:
{
  "namaCust": "nama lengkap customer/prospek (BUKAN nama sales)",
  "noHP": "nomor HP/WA prospek jika ada (format: 08xxx atau 628xxx). Jika tidak ada, isi: Tidak disebutkan",
  "alamat": "alamat lengkap atau kota/area tempat tinggal prospek",
  "penghasilanEstimasi": "estimasi penghasilan bulanan (contoh: 5-10 juta/bulan)",
  "produkDiminati": "NAMA PRODUK/TIPE properti yang diminati. Contoh: Kavling 6x12, Cluster Mahesa Tipe 36/63, Rumah 2 lantai. JANGAN isi dengan waktu/kapan beli",
  "urgensi": "KAPAN prospek ingin membeli/realisasi. Contoh: 3 bulan ke depan, Belum pasti, Segera. JANGAN isi dengan nama produk",
  "status": "Hot atau Warm atau Cold (pilih SATU saja, tanpa tanda kutip tambahan)",
  "skorPrioritas": "angka bulat 1 sampai 10",
  "masalahCustomer": "kendala/masalah/kekhawatiran customer. Contoh: budget terbatas, lokasi jauh dari kantor, butuh persetujuan pasangan, KPR belum disetujui",
  "catatanAI": "analisis singkat 2-3 kalimat dan rekomendasi tindak lanjut spesifik untuk sales"
}

PENTING - JANGAN TERTUKAR:
- "produkDiminati" = NAMA PRODUK properti (kavling, cluster, tipe rumah, ukuran tanah)
- "urgensi" = WAKTU/KAPAN mau beli (3 bulan, segera, belum pasti)
- "status" = HANYA boleh isi: Hot, Warm, atau Cold
- "skorPrioritas" = HANYA angka 1-10

Panduan status:
- Hot: Sangat tertarik, ada dana/KPR, ingin segera beli (1-3 bulan)
- Warm: Tertarik tapi butuh pertimbangan, follow up 1-3x lagi
- Cold: Masih survey, belum jelas kapan, banyak pertimbangan

Panduan skor prioritas:
- 9-10: Siap beli, ada dana, urgensi tinggi
- 7-8: Tertarik kuat, butuh sedikit nurturing
- 5-6: Tertarik tapi banyak pertimbangan
- 3-4: Masih survey, tidak ada urgensi jelas
- 1-2: Hampir tidak ada potensi jangka pendek

Jika info tidak ada dalam chat, isi dengan string "Tidak disebutkan".`;

export async function POST(request: NextRequest) {
  try {
    const { chatText, namaSales, namaFile, noHpManual } = await request.json();

    if (!chatText?.trim()) {
      return NextResponse.json({ success: false, error: 'Teks chat tidak boleh kosong.' }, { status: 400 });
    }
    if (!process.env.NEXT_PUBLIC_GROQ_API_KEY) {
      return NextResponse.json({ success: false, error: 'GROQ_API_KEY belum dikonfigurasi di .env.local' }, { status: 500 });
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: PROMPT },
        { role: 'user', content: `Percakapan WhatsApp:\n\n${chatText.slice(0, 12000)}` },
      ],
      temperature: 0.2,
      max_tokens: 1024,
    });

    const raw = completion.choices[0]?.message?.content || '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ success: false, error: 'AI tidak dapat mengekstrak data. Pastikan file chat valid.' }, { status: 422 });
    }

    const extracted = JSON.parse(jsonMatch[0]);
    const now = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Validasi status harus Hot/Warm/Cold
    const validStatus = ['Hot', 'Warm', 'Cold'];
    const rawStatus = String(extracted.status || '').trim();
    const finalStatus = validStatus.includes(rawStatus) ? rawStatus : 'Cold';

    // Validasi skor harus angka 1-10
    const finalSkor = Math.min(10, Math.max(1, Number(extracted.skorPrioritas) || 5));

    // Map ke format field database
    const data = {
      tanggalRekap: now,
      namaSales: namaSales || 'Unknown',
      namaCust: extracted.namaCust || 'Tidak disebutkan',
      noHP: noHpManual || extracted.noHP || 'Tidak disebutkan',
      alamat: extracted.alamat || 'Tidak disebutkan',
      penghasilanEstimasi: extracted.penghasilanEstimasi || 'Tidak disebutkan',
      produkDiminati: extracted.produkDiminati || 'Tidak disebutkan',
      urgensi: extracted.urgensi || 'Tidak disebutkan',
      status: finalStatus,
      skorPrioritas: finalSkor,
      catatanAI: extracted.catatanAI || '',
      namaFile: namaFile || 'Tidak disebutkan',
      masalahCustomer: extracted.masalahCustomer || 'Tidak disebutkan',
      catatanSales: '',
    };

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: `Error: ${msg}` }, { status: 500 });
  }
}
