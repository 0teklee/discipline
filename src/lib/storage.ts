import type { ExamSession, SetsMeta } from '@/types'

const SESSIONS_KEY = 'discipline_sessions'
const SETS_META_KEY = 'discipline_sets_meta'

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function set<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export const storage = {
  getSessions: (): ExamSession[] => get<ExamSession[]>(SESSIONS_KEY, []),
  addSession: (session: ExamSession): void => {
    const sessions = storage.getSessions()
    set(SESSIONS_KEY, [session, ...sessions])
  },
  getSession: (id: string): ExamSession | undefined =>
    storage.getSessions().find((s) => s.id === id),
  clearSessions: (): void => set(SESSIONS_KEY, []),

  getSetsMeta: (): SetsMeta[] => get<SetsMeta[]>(SETS_META_KEY, []),
  upsertSetMeta: (meta: SetsMeta): void => {
    const all = storage.getSetsMeta()
    const idx = all.findIndex((m) => m.id === meta.id)
    if (idx >= 0) all[idx] = meta
    else all.push(meta)
    set(SETS_META_KEY, all)
  },
}
