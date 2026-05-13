'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import UploadZone from '@/components/UploadZone';
import ProspectResult from '@/components/ProspectResult';
import LoginPage from '@/components/LoginPage';
import UserManagement from '@/components/UserManagement';
import { ProspectData, UserAccount } from '@/lib/types';
import { getSession, logout } from '@/lib/auth';


const Dashboard = dynamic(() => import('@/components/Dashboard'), { ssr: false });

type RekapStatus = 'idle' | 'loading' | 'success' | 'error';
type AdminTab = 'rekap' | 'dashboard' | 'users';
type SalesTab = 'rekap';
interface Toast { id: number; type: 'success' | 'error' | 'info'; message: string; }

export default function HomePage() {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // admin tabs: rekap | dashboard | users
  const [adminTab, setAdminTab] = useState<AdminTab>('rekap');
  // sales tab: only rekap
  const [salesTab] = useState<SalesTab>('rekap');

  const [chatText, setChatText] = useState('');
  const [namaFile, setNamaFile] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [prospects, setProspects] = useState<ProspectData[]>([]);
  const [rekapStatus, setRekapStatus] = useState<Record<number, RekapStatus>>({});
  const [noHpManual, setNoHpManual] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [toastId, setToastId] = useState(0);
  const [uploadResetKey, setUploadResetKey] = useState(0);

  // Check existing session
  useEffect(() => {
    const session = getSession();
    if (session) setUser(session);
    setAuthChecked(true);
  }, []);

  const addToast = (type: Toast['type'], message: string) => {
    const id = toastId + 1;
    setToastId(id);
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };

  const handleLogin = (u: UserAccount) => {
    setUser(u);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setProspects([]);
    setChatText('');
    setNamaFile('');
  };

  const handleFile = (text: string, filename: string) => {
    setChatText(text);
    setNamaFile(filename);

    // Reset hasil ekstraksi sebelumnya agar langsung terlihat fresh
    setProspects([]);
    setRekapStatus({});

    // Auto-extract nomor HP dari nama file WhatsApp, contoh:
    // "WhatsApp Chat with Septa_ (0852-3690-7266).zip"
    // "WhatsApp Chat with Budi (08123456789).txt"
    const phoneMatch = filename.match(/\(([0-9+\-\s]{8,})\)/);
    if (phoneMatch) {
      // Hapus spasi dan strip, hanya sisakan angka dan +
      const cleanPhone = phoneMatch[1].replace(/[\s\-]/g, '');
      setNoHpManual(cleanPhone);
    }
  };

  const handleProcess = async () => {
    if (!chatText.trim()) { addToast('error', 'Upload file chat terlebih dahulu!'); return; }

    setIsProcessing(true);
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatText,
          namaSales: user?.nama || user?.username || 'Unknown',
          namaFile,
          noHpManual: noHpManual.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setProspects([json.data]);
        setRekapStatus({ 0: 'idle' });
        addToast('success', `✅ Data customer "${json.data.namaCust}" berhasil diekstrak AI!`);
        setChatText('');
        setNamaFile('');
        setNoHpManual('');
      } else {
        addToast('error', json.error || 'Gagal mengekstrak data');
      }
    } catch {
      addToast('error', 'Gagal menghubungi server. Cek koneksi internet.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRekap = async (index: number, editedData: ProspectData) => {
    setRekapStatus((s) => ({ ...s, [index]: 'loading' }));
    try {
      // 1) Simpan ke database MySQL
      const dbRes = await fetch('/api/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedData),
      });
      const dbJson = await dbRes.json();
      if (!dbJson.success) {
        setRekapStatus((s) => ({ ...s, [index]: 'error' }));
        addToast('error', dbJson.error || 'Gagal menyimpan ke database');
        return;
      }

      // 2) Kirim juga ke Google Sheets
      try {
        const sheetRes = await fetch('/api/sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editedData),
        });
        const sheetJson = await sheetRes.json();
        if (!sheetJson.success) {
          console.warn('[sheets] gagal:', sheetJson.error);
          addToast('info', '⚠️ Data tersimpan di database, tapi gagal kirim ke Google Sheets');
        }
      } catch {
        console.warn('[sheets] error koneksi');
        addToast('info', '⚠️ Data tersimpan di database, tapi gagal kirim ke Google Sheets');
      }

      // 3) Sukses — tampilkan sebentar lalu reset semua
      setRekapStatus((s) => ({ ...s, [index]: 'success' }));
      addToast('success', '🎉 Data berhasil disimpan ke Database & Google Sheets!');

      // Reset setelah 1.5 detik agar user sempat lihat pesan sukses
      setTimeout(() => {
        setProspects([]);
        setRekapStatus({});
        setChatText('');
        setNamaFile('');
        setNoHpManual('');
        setUploadResetKey((k) => k + 1);
      }, 1500);

    } catch {
      setRekapStatus((s) => ({ ...s, [index]: 'error' }));
      addToast('error', 'Gagal terhubung ke server');
    }
  };

  // Belum auth-checked → loading
  if (!authChecked) return null;

  // Belum login → tampilkan login
  if (!user) return <LoginPage onLogin={handleLogin} />;

  const isAdmin = user.role === 'admin';

  // =================== RENDER ===================
  return (
    <>
      {/* HEADER */}
      <header className="header">
        <div className="header-logo">
          <svg viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="10" fill="url(#g)" />
            <path d="M10 20l6-8 5 6 4-4 6 6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="36" y2="36">
                <stop stopColor="#6366f1" /><stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <div>
            <div className="header-title">RekapAI</div>
            <div className="header-sub">Sales Intelligence — Wangsa City</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="user-info">
            <span className={`role-badge ${user.role}`}>
              {user.role === 'admin' ? '👑 Admin' : '👤 Sales'}
            </span>
            <span className="user-name">{user.nama}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>🚪 Keluar</button>
        </div>
      </header>

      {/* TABS */}
      <nav className="tabs">
        <button
          className={`tab-btn${(isAdmin ? adminTab : salesTab) === 'rekap' ? ' active' : ''}`}
          onClick={() => isAdmin && setAdminTab('rekap')}
        >
          📤 Sales Input
        </button>
        {isAdmin && (
          <>
            <button
              className={`tab-btn${adminTab === 'dashboard' ? ' active' : ''}`}
              onClick={() => setAdminTab('dashboard')}
            >
              📊 Dashboard
            </button>
            <button
              className={`tab-btn${adminTab === 'users' ? ' active' : ''}`}
              onClick={() => setAdminTab('users')}
            >
              👥 Kelola Akun
            </button>
          </>
        )}
      </nav>

      {/* CONTENT */}
      <main className="main">
        {/* REKAP TAB (admin & sales) */}
        {(isAdmin ? adminTab === 'rekap' : salesTab === 'rekap') && (
          <>
            <div className="sales-header">
              <h2>Rekap Prospek Otomatis</h2>
              <p>Upload export chat WhatsApp → AI ekstrak data otomatis → Satu klik rekap ke Database</p>
            </div>

            {/* Step guide */}
            <div className="step-guide">
              <div className="step"><span className="step-num">1</span>Export chat WA (Tanpa Media) → .txt</div>
              <div className="step-arrow">→</div>
              <div className="step"><span className="step-num">2</span>Upload file & Proses AI</div>
              <div className="step-arrow">→</div>
              <div className="step"><span className="step-num">3</span>Klik REKAP simpan ke DB</div>
            </div>

            {/* Sales info badge */}
            <div className="sales-info-row">
              <span className="sales-info-label">👤 Sales:</span>
              <span className="sales-info-value">{user.nama}</span>
            </div>

            {/* No HP Customer input */}
            <div className="nohp-input-wrap">
              <div className="nohp-input-row">
                <label className="nohp-label" htmlFor="nohp-customer">📱 No. HP Customer:</label>
                <input
                  id="nohp-customer"
                  className="nohp-input"
                  type="tel"
                  placeholder="Contoh: 08123456789 atau 628123456789"
                  value={noHpManual}
                  onChange={(e) => setNoHpManual(e.target.value)}
                  disabled={isProcessing}
                />
              </div>
              <div className="nohp-tip">
                <span className="tip-icon">💡</span>
                <span>
                  Export WA hanya menampilkan <strong>nama kontak</strong>, bukan nomor.
                  Cara cek: <strong>Buka chat WA</strong> → tap nama di atas → scroll ke bawah → nomor terlihat.
                  Jika nomor sudah tahu, ketik langsung di sini.
                </span>
              </div>
            </div>

            <UploadZone onFile={handleFile} disabled={isProcessing} resetKey={uploadResetKey} />


            <button className="process-btn" onClick={handleProcess} disabled={isProcessing || !chatText}>
              {isProcessing ? (
                <>
                  <span style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  Groq AI sedang menganalisis chat...
                </>
              ) : (
                <>🤖 Proses dengan Groq AI</>
              )}
            </button>

            {isProcessing && (
              <div className="ai-loading">
                <div className="spinner" />
                <p><strong>AI sedang bekerja...</strong></p>
                <p style={{ marginTop: 6 }}>Membaca dan menganalisis percakapan WhatsApp</p>
              </div>
            )}

            {prospects.length > 0 && (
              <div className="prospects-section">
                <h3>
                  Hasil Ekstraksi AI
                  <span className="prospect-count">{prospects.length}</span>
                </h3>
                {prospects.map((p, i) => (
                  <ProspectResult
                    key={i}
                    prospect={p}
                    index={i}
                    onRekap={handleRekap}
                    rekapStatus={rekapStatus[i] || 'idle'}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* DASHBOARD TAB (admin only) */}
        {isAdmin && adminTab === 'dashboard' && <Dashboard />}

        {/* USER MANAGEMENT TAB (admin only) */}
        {isAdmin && adminTab === 'users' && <UserManagement />}
      </main>

      {/* TOAST */}
      <div className="toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>
        ))}
      </div>
    </>
  );
}
