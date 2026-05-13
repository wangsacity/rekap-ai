import { UserAccount } from './types';

const SESSION_KEY = 'rekap_session';

// =================== Session (client-side, sessionStorage) ===================

export function getSession(): UserAccount | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as UserAccount;
}

export function setSession(user: UserAccount): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function logout(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

// =================== API calls ke server MySQL ===================

export async function loginApi(username: string, password: string): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

export async function getUsersApi(): Promise<UserAccount[]> {
  const res = await fetch('/api/auth/users');
  const json = await res.json();
  return json.users || [];
}

export async function createUserApi(data: {
  username: string;
  password: string;
  nama: string;
  role: string;
}): Promise<{ success: boolean; error?: string }> {
  const res = await fetch('/api/auth/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteUserApi(id: string): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`/api/auth/users?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return res.json();
}
