import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { API, TOKEN_KEY, USER_KEY } from '../lib/config';
import type { AuthMode, ChatUser, HealthStatus } from '../types';

function isChatUser(value: unknown): value is ChatUser {
  const maybe = value as Partial<ChatUser> | null;
  return Boolean(maybe && typeof maybe.id === 'string' && typeof maybe.username === 'string');
}

function getStoredAuth(): { token: string | null; user: ChatUser | null } {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userJson = localStorage.getItem(USER_KEY);
    const parsed = userJson ? (JSON.parse(userJson) as unknown) : null;
    const user = isChatUser(parsed) ? parsed : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

interface UseAuthOptions {
  onAuthSuccess?: (token: string, user: ChatUser) => Promise<void> | void;
}

export function useAuth(options: UseAuthOptions = {}) {
  const { onAuthSuccess } = options;
  const [user, setUser] = useState<ChatUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [authError, setAuthError] = useState('');
  const [status, setStatus] = useState<HealthStatus>('checking');

  useEffect(() => {
    const { token: storedToken, user: storedUser } = getStoredAuth();
    if (!storedToken) {
      setStatus('connected');
      return;
    }
    fetch(`${API}/auth/me`, {
      credentials: 'include',
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('session invalid'))))
      .then(async (data: { user?: ChatUser }) => {
        const nextUser = data.user || storedUser;
        if (!nextUser) throw new Error('missing user');
        setToken(storedToken);
        setUser(nextUser);
        localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
        if (onAuthSuccess) await onAuthSuccess(storedToken, nextUser);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      })
      .finally(() => setStatus('connected'));
  }, [onAuthSuccess]);

  useEffect(() => {
    if (token || user) return;
    fetch(`${API}/health`)
      .then((res) => res.json())
      .then((data: { ok?: boolean }) => setStatus(data.ok ? 'connected' : 'error'))
      .catch(() => setStatus('error'));
  }, [token, user]);

  async function handleAuth(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = String(formData.get('username') || '').trim();
    const password = String(formData.get('password') || '');
    setAuthError('');
    if (!username || !password) return setAuthError('Username and password required');
    if (password.length < 6) return setAuthError('Password must be at least 6 characters');

    const url = authMode === 'signup' ? `${API}/auth/signup` : `${API}/auth/login`;
    fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
      .then((res) => res.json())
      .then(async (data: { error?: string; token?: string; user?: ChatUser }) => {
        if (data.error) return setAuthError(data.error);
        if (!data.token || !data.user) return setAuthError('Invalid auth response');
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        if (onAuthSuccess) await onAuthSuccess(data.token, data.user);
      })
      .catch(() => setAuthError('Request failed'));
  }

  async function logout(makeHeaders: () => Record<string, string>) {
    try {
      if (token) {
        await fetch(`${API}/auth/logout`, {
          method: 'POST',
          credentials: 'include',
          headers: makeHeaders(),
        });
      }
    } catch {
      // ignore
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setAuthError('');
  }

  return {
    user,
    token,
    authMode,
    setAuthMode,
    authError,
    setAuthError,
    status,
    handleAuth,
    logout,
  };
}
