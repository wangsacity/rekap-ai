'use client';
import { useCallback, useEffect, useState } from 'react';
import { ProspectData } from '@/lib/types';

function getPriorityClass(score: number) {
  if (score >= 8) return 'high';
  if (score >= 5) return 'medium';
  return 'low';
}

export default function Dashboard() {
  const [data, setData] = useState<ProspectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSales, setFilterSales] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [sortBy, setSortBy] = useState<'skorPrioritas' | 'tanggalRekap'>('skorPrioritas');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/prospects');
      const json = await res.json();
      if (json.success) setData(json.data || []);
      else setError(json.error || 'Gagal memuat data');
    } catch {
      setError('Gagal terhubung ke server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const salesOptions = [...new Set(data.map((d) => d.namaSales).filter(Boolean))];

  const filtered = data
    .filter((d) => (!filterStatus || d.status === filterStatus))
    .filter((d) => (!filterSales || d.namaSales === filterSales))
    .filter((d) => {
      if (!filterPriority) return true;
      const s = Number(d.skorPrioritas);
      if (filterPriority === 'high') return s >= 8;
      if (filterPriority === 'medium') return s >= 5 && s < 8;
      return s < 5;
    })
    .sort((a, b) => {
      if (sortBy === 'skorPrioritas') return Number(b.skorPrioritas) - Number(a.skorPrioritas);
      return (b.tanggalRekap || '').localeCompare(a.tanggalRekap || '');
    });

  const stats = {
    total: data.length,
    hot: data.filter((d) => d.status === 'Hot').length,
    warm: data.filter((d) => d.status === 'Warm').length,
    cold: data.filter((d) => d.status === 'Cold').length,
    avgScore: data.length ? (data.reduce((s, d) => s + Number(d.skorPrioritas || 0), 0) / data.length).toFixed(1) : '0',
  };

  return (
    <div className="dashboard">
      <div className="dash-header">
        <h2>📊 Dashboard Atasan</h2>
        <p>Rekap seluruh prospek sales dengan skala prioritas AI</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Prospek</div>
        </div>
        <div className="stat-card hot">
          <div className="stat-icon">🔥</div>
          <div className="stat-value">{stats.hot}</div>
          <div className="stat-label">Hot Leads</div>
        </div>
        <div className="stat-card warm">
          <div className="stat-icon">☀️</div>
          <div className="stat-value">{stats.warm}</div>
          <div className="stat-label">Warm Leads</div>
        </div>
        <div className="stat-card cold">
          <div className="stat-icon">❄️</div>
          <div className="stat-value">{stats.cold}</div>
          <div className="stat-label">Cold Leads</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-value">{stats.avgScore}</div>
          <div className="stat-label">Rata-rata Skor</div>
        </div>
      </div>

      <div className="filter-bar">
        <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Semua Status</option>
          <option value="Hot">🔥 Hot</option>
          <option value="Warm">☀️ Warm</option>
          <option value="Cold">❄️ Cold</option>
        </select>
        <select className="filter-select" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
          <option value="">Semua Prioritas</option>
          <option value="high">🔴 Tinggi (8-10)</option>
          <option value="medium">🟡 Sedang (5-7)</option>
          <option value="low">🟢 Rendah (1-4)</option>
        </select>
        {salesOptions.length > 0 && (
          <select className="filter-select" value={filterSales} onChange={(e) => setFilterSales(e.target.value)}>
            <option value="">Semua Sales</option>
            {salesOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
          <option value="skorPrioritas">Urutkan: Skor Tertinggi</option>
          <option value="tanggalRekap">Urutkan: Terbaru</option>
        </select>
        <button className="refresh-btn" onClick={fetchData}>🔄 Refresh</button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text2)' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          Memuat data dari database...
        </div>
      )}

      {error && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <h3>Gagal Memuat Data</h3>
          <p>{error}</p>
          <p style={{ marginTop: 8, fontSize: 13 }}>Pastikan server berjalan dan database terkonfigurasi dengan benar</p>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>Belum Ada Data Rekap</h3>
          <p>Data akan muncul di sini setelah sales melakukan rekap dari tab Sales Input.</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Skor</th>
                <th>Status</th>
                <th>Nama Customer</th>
                <th>No. HP</th>
                <th>Produk Diminati</th>
                <th>Urgensi</th>
                <th>Sales</th>
                <th>Tanggal</th>
                <th>File</th>
                <th>Catatan AI</th>
                <th>Catatan Sales</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => {
                const pClass = getPriorityClass(Number(d.skorPrioritas));
                return (
                  <tr key={i}>
                    <td><span className={`score-pill ${pClass}`}>{d.skorPrioritas}</span></td>
                    <td>
                      <span className={`status-badge ${d.status}`} style={{ fontSize: 12, padding: '3px 10px' }}>
                        {d.status === 'Hot' ? '🔥' : d.status === 'Warm' ? '☀️' : '❄️'} {d.status}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{d.namaCust}</td>
                    <td style={{ color: 'var(--text2)' }}>{d.noHP}</td>
                    <td style={{ maxWidth: 160, whiteSpace: 'normal' }}>{d.produkDiminati}</td>
                    <td style={{ color: 'var(--text2)' }}>{d.urgensi}</td>
                    <td style={{ color: 'var(--accent)' }}>{d.namaSales}</td>
                    <td style={{ color: 'var(--text3)', fontSize: 12 }}>{d.tanggalRekap}</td>
                    <td style={{ color: 'var(--text3)', fontSize: 12 }}>{d.namaFile}</td>
                    <td style={{ maxWidth: 240, whiteSpace: 'normal', color: 'var(--text2)', fontSize: 12 }}>{d.catatanAI}</td>
                    <td style={{ maxWidth: 200, whiteSpace: 'normal', color: 'var(--warm)', fontSize: 12 }}>{d.catatanSales || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
