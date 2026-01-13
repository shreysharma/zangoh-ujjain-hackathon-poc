import { env } from '../config/env';

const getApiBase = () => {
  if (env.apiBase) return env.apiBase;
  // Derive from wsHost if possible: ws://host -> http://host
  if (env.wsHost.startsWith('wss://')) {
    return 'https://' + env.wsHost.replace(/^wss?:\/\//, '').replace(/\/ws$/, '');
  }
  if (env.wsHost.startsWith('ws://')) {
    return 'http://' + env.wsHost.replace(/^wss?:\/\//, '').replace(/\/ws$/, '');
  }
  return '';
};

export const authService = {
  async login(email: string, password: string): Promise<{ token?: string; error?: string }> {
    const base = getApiBase();
    if (!base) return { error: 'API base URL not configured' };
    try {
      const res = await fetch(`${base}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const text = await res.text();
        console.log('[auth] login failed', res.status, text);
        return { error: text || `Login failed (${res.status})` };
      }
      const data = await res.json();
      console.log('[auth] login response', data);
      if (typeof data === 'string') {
        return { token: data };
      }
      if (data?.token) {
        return { token: data.token };
      }
      if (data?.access_token) {
        return { token: data.access_token };
      }
      return { error: 'Unexpected login response' };
    } catch (e: any) {
      console.log('[auth] login error', e);
      return { error: e?.message || 'Login error' };
    }
  },

  async signup(name: string, email: string, password: string, inviteCode: string): Promise<{ token?: string; error?: string }> {
    const base = getApiBase();
    if (!base) return { error: 'API base URL not configured' };
    try {
      const res = await fetch(`${base}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, invite_code: inviteCode }),
      });
      if (!res.ok) {
        const text = await res.text();
        return { error: text || `Signup failed (${res.status})` };
      }
      const data = await res.json();
      if (typeof data === 'string') return { token: data };
      if (data?.token) return { token: data.token };
      return { error: 'Unexpected signup response' };
    } catch (e: any) {
      return { error: e?.message || 'Signup error' };
    }
  },

  async createInvite(role: string = 'user'): Promise<{ code?: string; error?: string }> {
    const base = getApiBase();
    if (!base) return { error: 'API base URL not configured' };
    try {
      const res = await fetch(`${base}/auth/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const text = await res.text();
        return { error: text || `Invite failed (${res.status})` };
      }
      const data = await res.json();
      if (typeof data === 'string') return { code: data };
      if (data?.code) return { code: data.code };
      return { code: JSON.stringify(data) };
    } catch (e: any) {
      return { error: e?.message || 'Invite error' };
    }
  },
};
