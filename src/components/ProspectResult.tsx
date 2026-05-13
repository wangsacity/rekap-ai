'use client';
import { useState } from 'react';
import { ProspectData } from '@/lib/types';

interface Props {
  prospect: ProspectData;
  index: number;
  onRekap: (index: number, editedData: ProspectData) => Promise<void>;
  rekapStatus: 'idle' | 'loading' | 'success' | 'error';
}

function getPriorityClass(score: number) {
  if (score >= 8) return 'high';
  if (score >= 5) return 'medium';
  return 'low';
}
function getPriorityLabel(score: number) {
  if (score >= 8) return '🔴 Prioritas Tinggi';
  if (score >= 5) return '🟡 Prioritas Sedang';
  return '🟢 Prioritas Rendah';
}

export default function ProspectResult({ prospect, index, onRekap, rekapStatus }: Props) {
  const [form, setForm] = useState<ProspectData>({ ...prospect });

  const set = <K extends keyof ProspectData>(key: K, value: ProspectData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const pClass = getPriorityClass(Number(form.skorPrioritas));
  const barWidth = `${Number(form.skorPrioritas) * 10}%`;
  const isSubmitted = rekapStatus === 'success';

  return (
    <div className="prospect-card">
      {/* ── TOP ROW ── */}
      <div className="card-top">
        <div style={{ flex: 1 }}>
          <div className="pf-label">👤 Nama Customer</div>
          <input
            className="pf-input pf-name"
            value={form.namaCust}
            onChange={(e) => set('namaCust', e.target.value)}
            placeholder="Nama customer..."
            disabled={isSubmitted}
          />
          <div className="pf-label" style={{ marginTop: 8 }}>📱 No. HP / WA</div>
          <input
            className="pf-input"
            type="tel"
            value={form.noHP}
            onChange={(e) => set('noHP', e.target.value)}
            placeholder="08xxxxxxxxxx"
            disabled={isSubmitted}
          />
        </div>

        <div className="badges" style={{ flexShrink: 0, alignSelf: 'flex-start', paddingTop: 4 }}>
          {/* Status select */}
          <select
            className={`status-select ${form.status}`}
            value={form.status}
            onChange={(e) => set('status', e.target.value as ProspectData['status'])}
            disabled={isSubmitted}
          >
            <option value="Hot">🔥 Hot</option>
            <option value="Warm">☀️ Warm</option>
            <option value="Cold">❄️ Cold</option>
          </select>
          <span className={`priority-badge ${pClass}`}>{getPriorityLabel(Number(form.skorPrioritas))}</span>
        </div>
      </div>

      {/* ── SKOR PRIORITAS ── */}
      <div className="score-bar-wrap">
        <div className="score-bar-label">
          <span>Skor Prioritas AI</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="number"
              min={1} max={10}
              className="score-input"
              value={form.skorPrioritas}
              onChange={(e) => set('skorPrioritas', Math.min(10, Math.max(1, Number(e.target.value) || 1)))}
              disabled={isSubmitted}
            />
            <span style={{ color: 'var(--text3)', fontSize: 12 }}>/10</span>
          </div>
        </div>
        <div className="score-bar-track">
          <div className={`score-bar-fill ${pClass}`} style={{ width: barWidth }} />
        </div>
      </div>

      {/* ── MAIN FIELDS GRID ── */}
      <div className="data-grid">
        <div className="data-field">
          <div className="data-field-label">📍 Alamat</div>
          <input
            className="pf-input"
            value={form.alamat}
            onChange={(e) => set('alamat', e.target.value)}
            placeholder="Kota / area..."
            disabled={isSubmitted}
          />
        </div>
        <div className="data-field">
          <div className="data-field-label">💰 Penghasilan Est.</div>
          <input
            className="pf-input"
            value={form.penghasilanEstimasi}
            onChange={(e) => set('penghasilanEstimasi', e.target.value)}
            placeholder="Contoh: 5-10 juta/bulan"
            disabled={isSubmitted}
          />
        </div>
        <div className="data-field">
          <div className="data-field-label">🏠 Produk Diminati</div>
          <input
            className="pf-input"
            value={form.produkDiminati}
            onChange={(e) => set('produkDiminati', e.target.value)}
            placeholder="Kavling / rumah / tipe..."
            disabled={isSubmitted}
          />
        </div>
        <div className="data-field">
          <div className="data-field-label">⏰ Urgensi / Target Beli</div>
          <input
            className="pf-input"
            value={form.urgensi}
            onChange={(e) => set('urgensi', e.target.value)}
            placeholder="Contoh: 3 bulan ke depan"
            disabled={isSubmitted}
          />
        </div>
        <div className="data-field">
          <div className="data-field-label">📁 Nama File</div>
          <input
            className="pf-input"
            value={form.namaFile}
            onChange={(e) => set('namaFile', e.target.value)}
            placeholder="nama-file.txt"
            disabled={isSubmitted}
          />
        </div>
        <div className="data-field">
          <div className="data-field-label">👤 Nama Sales</div>
          <input
            className="pf-input"
            value={form.namaSales}
            onChange={(e) => set('namaSales', e.target.value)}
            disabled={isSubmitted}
          />
        </div>
      </div>

      {/* ── CATATAN AI (readonly) ── */}
      {form.catatanAI && (
        <div className="ai-notes">
          <div className="ai-notes-label">🤖 Analisis AI (otomatis)</div>
          <div className="ai-notes-text">{form.catatanAI}</div>
        </div>
      )}

      {/* ── MASALAH CUSTOMER ── */}
      <div className="sales-notes-wrap">
        <div className="sales-notes-label">⚠️ Masalah / Kendala Customer</div>
        <textarea
          className="sales-notes-input"
          value={form.masalahCustomer}
          onChange={(e) => set('masalahCustomer', e.target.value)}
          placeholder="Kendala customer: budget terbatas, lokasi jauh, belum dapat persetujuan pasangan, KPR belum disetujui, dll..."
          rows={2}
          disabled={isSubmitted}
        />
      </div>

      {/* ── CATATAN SALES (editable) ── */}
      <div className="sales-notes-wrap">
        <div className="sales-notes-label">📝 Catatan Sales</div>
        <textarea
          className="sales-notes-input"
          value={form.catatanSales}
          onChange={(e) => set('catatanSales', e.target.value)}
          placeholder="Tambahkan catatan manual dari sales (opsional)..."
          rows={3}
          disabled={isSubmitted}
        />
      </div>

      {/* ── META INFO ── */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>
        <span>🕐 {form.tanggalRekap}</span>
      </div>

      {/* ── REKAP BUTTON ── */}
      <button
        className={`rekap-btn${rekapStatus === 'success' ? ' success' : rekapStatus === 'error' ? ' error' : ''}`}
        onClick={() => onRekap(index, form)}
        disabled={rekapStatus === 'loading' || rekapStatus === 'success'}
      >
        {rekapStatus === 'loading' && <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />}
        {rekapStatus === 'idle' && '📤 REKAP SIMPAN KE DATABASE'}
        {rekapStatus === 'loading' && 'Mengirim...'}
        {rekapStatus === 'success' && '✅ Berhasil Direkap!'}
        {rekapStatus === 'error' && '❌ Gagal — Coba Lagi'}
      </button>
    </div>
  );
}
