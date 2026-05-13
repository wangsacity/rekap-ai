# RekapAI — Sales Intelligence Platform

Aplikasi rekap otomatis prospek dari export chat WhatsApp menggunakan **Groq AI (gratis)** → Google Sheets.

---

## 🚀 Setup Cepat

### 1. Dapatkan Groq API Key (Gratis)
1. Buka [https://console.groq.com](https://console.groq.com)
2. Daftar / login dengan Google
3. Klik **API Keys** → **Create API Key**
4. Copy key-nya

### 2. Setup Google Sheets + Apps Script

#### Buat Google Sheet:
1. Buka [Google Sheets](https://sheets.google.com) → Buat sheet baru
2. Beri nama: **Rekap Sales Wangsa City**
3. Isi baris pertama (header) dengan kolom berikut (persis seperti ini, 14 kolom):

| A | B | C | D | E | F | G | H | I | J | K | L | M | N |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tanggalRekap | namaSales | namaCust | noHP | alamat | penghasilanEstimasi | produkDiminati | urgensi | status | skorPrioritas | catatanAI | namaFile | masalahCustomer | catatanSales |

#### Deploy Google Apps Script:
1. Di Google Sheet → **Extensions** → **Apps Script**
2. Hapus kode yang ada, paste kode berikut:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    // Data dikirim sebagai array terurut [A, B, C, ..., N]
    if (Array.isArray(data)) {
      sheet.appendRow(data);
    } else {
      // Fallback jika dikirim sebagai object
      sheet.appendRow([
        data.tanggalRekap || '',
        data.namaSales || '',
        data.namaCust || '',
        data.noHP || '',
        data.alamat || '',
        data.penghasilanEstimasi || '',
        data.produkDiminati || '',
        data.urgensi || '',
        data.status || '',
        data.skorPrioritas || '',
        data.catatanAI || '',
        data.namaFile || '',
        data.masalahCustomer || '',
        data.catatanSales || ''
      ]);
    }
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return ContentService
      .createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }
  var headers = values[0];
  var rows = values.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
  return ContentService
    .createTextOutput(JSON.stringify(rows))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. Klik **Deploy** → **New Deployment**
4. Type: **Web App**
5. Execute as: **Me**
6. Who has access: **Anyone**
7. Klik **Deploy** → Copy URL-nya

### 3. Buat file `.env.local`
```
GROQ_API_KEY=gsk_xxxx...
GOOGLE_SHEETS_URL=https://script.google.com/macros/s/xxxx.../exec
```

### 4. Jalankan Aplikasi
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000)

---

## 📱 Cara Pakai (untuk Sales)

1. **Export Chat WA**: Buka chat dengan prospek → ⋮ menu → **Export Chat** → **Tanpa Media** → simpan .txt
2. Buka aplikasi di browser/HP
3. Masukkan **nama Anda** sebagai sales
4. **Upload** file .txt tersebut (drag & drop atau klik)
5. Klik **"Proses dengan Groq AI"** — AI akan baca dan ekstrak semua data otomatis
6. Review kartu prospek yang muncul
7. Klik **"REKAP KE GOOGLE SHEETS"** — selesai! ✅

---

## 📊 Dashboard Atasan
- Klik tab **"Dashboard Atasan"**
- Lihat semua rekap dengan skor prioritas 1-10
- Filter berdasarkan Status (Hot/Warm/Cold), Sales, Prioritas
- Urutkan berdasarkan skor tertinggi atau terbaru
