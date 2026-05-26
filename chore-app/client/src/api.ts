import type { Member, Chore, Completion, CompletionWithMember, ChoreOccurrence } from '@shared/types';

async function fetchJson<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as { error?: string }).error ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

// ── Members ───────────────────────────────────────────────────────────────────

export const membersApi = {
  list: () => fetchJson<Member[]>('/api/members'),

  add: (name: string, color: string) =>
    fetchJson<Member>('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color }),
    }),

  remove: (id: number) =>
    fetchJson<{ ok: boolean }>(`/api/members/${id}`, { method: 'DELETE' }),
};

// ── Chores ────────────────────────────────────────────────────────────────────

export const choresApi = {
  list: () => fetchJson<Chore[]>('/api/chores'),

  events: (from: string, to: string) =>
    fetchJson<ChoreOccurrence[]>(`/api/chores/events?from=${from}&to=${to}`),

  add: (data: Omit<Chore, 'id' | 'created_at'>) =>
    fetchJson<Chore>('/api/chores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Omit<Chore, 'id' | 'created_at'>) =>
    fetchJson<Chore>(`/api/chores/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  remove: (id: number) =>
    fetchJson<{ ok: boolean }>(`/api/chores/${id}`, { method: 'DELETE' }),
};

// ── Completions ───────────────────────────────────────────────────────────────

export const completionsApi = {
  list: (choreId: number) =>
    fetchJson<CompletionWithMember[]>(`/api/completions?choreId=${choreId}`),

  add: (data: {
    chore_id: number;
    occurrence_date: string;
    completed_by?: number | null;
    note?: string | null;
  }) =>
    fetchJson<Completion>('/api/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  remove: (id: number) =>
    fetchJson<{ ok: boolean }>(`/api/completions/${id}`, { method: 'DELETE' }),
};
