import { create } from 'zustand'
import type { ExamSession } from '@/types'
import { storage } from '@/lib/storage'

interface HistoryState {
  sessions: ExamSession[]
  load: () => void
  clearAll: () => void
}

export const useHistoryStore = create<HistoryState>((set) => ({
  sessions: [],

  load: () => set({ sessions: storage.getSessions() }),

  clearAll: () => {
    storage.clearSessions()
    set({ sessions: [] })
  },
}))
