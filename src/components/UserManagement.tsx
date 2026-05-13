'use client';
import { useState, useEffect, useCallback } from 'react';
import { getUsersApi, createUserApi, deleteUserApi } from '@/lib/auth';
import { UserAccount, UserRole } from '@/lib/types';

export default function UserManagement() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', nama: '', role: 'sales' as UserRole });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUsersApi();
      setUsers(data);
    } catch {
      console.error('Gagal memuat users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    if (!form.username.trim() || !form.password.trim() || !form.nama.trim()) {
      setFormError('Semua field wajib diisi');
      return;
    }
    try {
      const result = await createUserApi(form);
      if (!result.success) {
        setFormError(result.error || 'Gagal membuat akun');
      } else {
        setFormSuccess(`Akun "${form.username}" berhasil dibuat!`);
        setForm({ username: '', password: '', nama: '', role: 'sales' });
        setShowForm(false);
        refresh();
      }
    } catch {
      setFormError('Gagal terhubung ke server');
    }
  };

  const handleDelete = async (user: UserAccount) => {
    if (user.id === 'admin-001') return; // Protect default admin
    if (!confirm(`Hapus akun "${user.username}"?`)) return;
    try {
      await deleteUserApi(user.id);
      refresh();
    } catch {
      alert('Gagal menghapus akun');
    }
  };

  return (
    <div className="usermgmt">
      <div className="usermgmt-header">
        <div>
          <h2>👥 Manajemen Akun Sales</h2>
          <p>Buat dan kelola akun untuk tim sales</p>
        </div>
        <button className="create-user-btn" onClick={() => { setShowForm(!showForm); setFormError(''); setFormSuccess(''); }}>
          {showForm ? '✕ Tutup' : '➕ Buat Akun Baru'}
        </button>
      </div>

      {showForm && (
        <form className="user-form" onSubmit={handleCreate}>
          <h3>Buat Akun Baru</h3>
          <div className="user-form-grid">
            <div className="login-field">
              <label>Nama Lengkap</label>
              <input
                type="text"
                placeholder="Nama sales..."
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
              />
            </div>
            <div className="login-field">
              <label>Username</label>
              <input
                type="text"
                placeholder="username unik..."
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>
            <div className="login-field">
              <label>Password</label>
              <input
                type="text"
                placeholder="password..."
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="login-field">
              <label>Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
                <option value="sales">Sales (Rekap saja)</option>
                <option value="admin">Admin (Semua akses)</option>
              </select>
            </div>
          </div>
          {formError && <div className="login-error">⚠️ {formError}</div>}
          {formSuccess && <div className="form-success">✅ {formSuccess}</div>}
          <button type="submit" className="login-btn" style={{ marginTop: 8 }}>
            💾 Simpan Akun
          </button>
        </form>
      )}

      <div className="users-table-wrap">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text2)' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            Memuat data akun...
          </div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Username</th>
                <th>Role</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.nama}</td>
                  <td style={{ color: 'var(--text2)' }}>{u.username}</td>
                  <td>
                    <span className={`role-badge ${u.role}`}>
                      {u.role === 'admin' ? '👑 Admin' : '👤 Sales'}
                    </span>
                  </td>
                  <td>
                    {u.id !== 'admin-001' ? (
                      <button className="delete-user-btn" onClick={() => handleDelete(u)}>
                        🗑️ Hapus
                      </button>
                    ) : (
                      <span style={{ color: 'var(--text3)', fontSize: 12 }}>Default</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
