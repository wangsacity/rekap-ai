'use client';
import { useEffect, useState } from 'react';
import { loginApi, setSession } from '@/lib/auth';
import { UserAccount } from '@/lib/types';

interface Props {
  onLogin: (user: UserAccount) => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [coba, setCoba] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCoba(process.env.NEXT_PUBLIC_COBA ?? "gagal")
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Username dan password tidak boleh kosong');
      return;
    }
    setLoading(true);
    try {
      const result = await loginApi(username.trim(), password.trim());
      if (!result.success || !result.user) {
        setError(result.error || 'Username atau password salah');
      } else {
        setSession(result.user);
        onLogin(result.user);
      }
    } catch {
      setError('Gagal terhubung ke server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <svg viewBox="0 0 48 48" fill="none" width="52" height="52">
            <rect width="48" height="48" rx="14" fill="url(#lg)" />
            <path d="M12 28l8-10 7 8 5-5 8 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="lg" x1="0" y1="0" x2="48" y2="48">
                <stop stopColor="#6366f1" /><stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1 className="login-title">RekapAI</h1>
        {coba}
        <p className="login-sub">Sales Intelligence — Wangsa City</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              type="text"
              placeholder="Masukkan username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="login-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="Masukkan password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && <div className="login-error">⚠️ {error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="btn-spinner" />
                Memverifikasi...
              </>
            ) : (
              '🔐 Masuk'
            )}
          </button>
        </form>

        <p className="login-hint">
          Default admin: <strong>admin</strong> / <strong>(lihat .env)</strong>
        </p>
      </div>
    </div>
  );
}
