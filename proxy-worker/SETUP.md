# 🔧 Setup Proxy Groq API — Bypass Firewall Kantor

WiFi kantor memblokir `api.groq.com`? Ikuti langkah di bawah untuk deploy **Cloudflare Worker** sebagai proxy gratis.

> **Free tier Cloudflare Workers:** 100.000 request/hari (sangat cukup!)

---

## Langkah 1: Buat Akun Cloudflare (Gratis)

1. Buka [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
2. Daftar dengan email → verifikasi email
3. Selesai ✅

## Langkah 2: Deploy Worker

### Cara A — Via Dashboard (Tanpa Install Apa-apa)

1. Buka [https://workers.cloudflare.com](https://workers.cloudflare.com) → Login
2. Klik **"Create a Service"** atau **"Create"**
3. Beri nama: `groq-proxy` → klik **Create**
4. Klik **"Quick Edit"**
5. Hapus semua kode di editor, lalu **copy-paste** isi file `proxy-worker/worker.js`
6. Klik **"Save and Deploy"**
7. Catat URL worker-nya, contoh: `https://groq-proxy.USERNAME.workers.dev`

### Cara B — Via CLI (Wrangler)

```bash
# Install Wrangler (CLI Cloudflare Workers)
npm install -g wrangler

# Login ke Cloudflare
wrangler login

# Masuk ke folder proxy-worker
cd proxy-worker

# Deploy!
wrangler deploy
```

Catat URL yang muncul, contoh: `https://groq-proxy.USERNAME.workers.dev`

## Langkah 3: Isi .env

Buka file `.env` di project, lalu isi `GROQ_BASE_URL`:

```env
GROQ_BASE_URL=https://groq-proxy.USERNAME.workers.dev/openai/v1
```

> ⚠️ **Penting:** Ganti `USERNAME` dengan username Cloudflare kamu. Jangan lupa tambahkan `/openai/v1` di akhir URL!

## Langkah 4: Restart Server

```bash
# Stop server (Ctrl+C), lalu jalankan ulang
npm run dev
```

## Langkah 5: Test

Coba proses file chat WA di aplikasi. Sekarang request ke Groq AI akan melewati Cloudflare Worker → tidak di-blokir firewall kantor! 🎉

---

## ❓ Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Worker error 524 | Request timeout, coba lagi |
| Worker error 403 | Cek apakah worker sudah di-deploy dengan benar |
| Masih access denied | Pastikan `.env` sudah benar dan server di-restart |
| URL salah | Pastikan ada `/openai/v1` di akhir URL |

## 🔒 Keamanan

- API Key Groq tetap aman karena dikirim dari **server** (API route Next.js), bukan dari browser
- Worker hanya meneruskan request, tidak menyimpan data apapun
- Worker domain `workers.dev` milik Cloudflare dan tidak akan di-blokir firewall
