const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface FetchOptions extends RequestInit {
  token?: string;
}

export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token: providedToken, ...fetchOptions } = options;
  const token = providedToken || getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...fetchOptions.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erreur serveur' }));
    throw new Error(error.message || 'Erreur serveur');
  }

  return response.json();
}

function getCurrentRole(): string {
  if (typeof window === 'undefined') return '';
  const path = window.location.pathname;
  if (path.startsWith('/admin')) return 'SUPER_ADMIN';
  if (path.startsWith('/vendor')) return 'VENDOR';
  if (path.startsWith('/manager')) return 'MANAGER';
  return '';
}

function getStorageKey(key: string, role?: string): string {
  const currentRole = role || getCurrentRole();
  return currentRole ? `${currentRole}_${key}` : key;
}

export function getToken(role?: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(getStorageKey('token', role));
}

export function setToken(token: string, role?: string): void {
  localStorage.setItem(getStorageKey('token', role), token);
}

export function removeToken(role?: string): void {
  localStorage.removeItem(getStorageKey('token', role));
}

export function getUser(role?: string): { id: string; email: string; name: string; role: string } | null {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem(getStorageKey('user', role));
  return user ? JSON.parse(user) : null;
}

export function setUser(user: { id: string; email: string; name: string; role: string }, role?: string): void {
  localStorage.setItem(getStorageKey('user', role), JSON.stringify(user));
}

export function removeUser(role?: string): void {
  localStorage.removeItem(getStorageKey('user', role));
}

export function logout(): void {
  const currentRole = getCurrentRole();
  removeToken(currentRole);
  removeUser(currentRole);
  window.location.href = '/login';
}
