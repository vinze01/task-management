import { defineStore } from 'pinia';

export type StoredUser = string | null;

/** Extract a safe display name from anything that might be in storage. Never returns raw JSON. */
export function toDisplayName(input: unknown): string | null {
  if (input === null || input === undefined) return null;

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return null;
    // Legacy / foreign value: another app on the same origin stored a JSON object under 'user'.
    // Never render that blob — parse it and pick a friendly name instead.
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return toDisplayName(JSON.parse(trimmed));
      } catch {
        return null;
      }
    }
    // Quoted JSON string like "\"rvt\""
    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      const inner = trimmed.slice(1, -1).trim();
      return inner || null;
    }
    // Absurdly long blobs are never a real username — treat as corrupted.
    if (trimmed.length > 80 && /[{}\":@]/.test(trimmed)) return null;
    return trimmed;
  }

  if (typeof input === 'number' || typeof input === 'boolean') return String(input);

  if (typeof input === 'object') {
    const o = input as Record<string, unknown>;
    const first = typeof o.firstName === 'string' ? o.firstName.trim() : '';
    const last = typeof o.lastName === 'string' ? o.lastName.trim() : '';
    const full = `${first} ${last}`.trim();
    if (full) return full;
    if (typeof o.username === 'string' && o.username.trim()) return o.username.trim();
    if (typeof o.name === 'string' && o.name.trim()) return o.name.trim();
    if (typeof o.displayName === 'string' && o.displayName.trim()) return o.displayName.trim();
    if (typeof o.email === 'string' && o.email.trim()) {
      const email = o.email.trim();
      const local = email.split('@')[0]?.trim();
      return local || email;
    }
    return null;
  }

  return null;
}

/** Adventurer avatars offered on the sign-in screen. */
export const AVATARS = ['🦊', '🐼', '🐸', '🦄', '🐝', '🦁', '🐙', '🌵', '⚡', '🚀', '🍕', '🎮'] as const;

function normalizeAvatar(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  if (!t || t.length > 12) return null;
  return t;
}

function readStoredAvatar(): string | null {
  try {
    return normalizeAvatar(localStorage.getItem('avatar'));
  } catch {
    return null;
  }
}
function readStoredUser(): StoredUser {
  try {
    const raw = localStorage.getItem('user');
    const name = toDisplayName(raw);
    // Self-heal: replace a JSON blob / corrupted value with the clean name (or clear it).
    try {
      if (raw !== null && name !== raw) {
        if (name) localStorage.setItem('user', name);
        else localStorage.removeItem('user');
      }
    } catch {
      // ignore write errors
    }
    return name;
  } catch {
    return null;
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: readStoredUser() as StoredUser,
    avatar: readStoredAvatar() as string | null,
  }),
  getters: {
    isAuthenticated: (s) => s.user !== null && s.user !== '',
  },
  actions: {
    login(value: unknown, avatar: unknown = null) {
      const name = toDisplayName(value);
      if (!name) return;
      this.user = name;
      // A freshly picked avatar wins; otherwise keep the device's saved one.
      const picked = normalizeAvatar(avatar);
      if (picked) this.avatar = picked;
      try {
        localStorage.setItem('user', name);
        if (picked) localStorage.setItem('avatar', picked);
      } catch {
        // ignore storage errors, keep in-memory session
      }
    },
    logout() {
      this.user = null;
      try {
        // Preserve tasks on logout to avoid accidental data loss.
        localStorage.removeItem('user');
      } catch {
        // ignore
      }
    },
    getUser(): StoredUser {
      if (this.user) return this.user;
      const name = readStoredUser();
      this.user = name;
      return name;
    },
  },
});
