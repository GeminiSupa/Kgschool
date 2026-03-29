import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info'

export type Toast = {
  id: string
  type: ToastType
  title?: string
  message: string
  createdAt: number
}

type ToastState = {
  toasts: Toast[]
  push: (toast: Omit<Toast, 'id' | 'createdAt'>) => void
  remove: (id: string) => void
  clear: () => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) =>
    set((state) => {
      const id = crypto.randomUUID()
      const next: Toast = { id, createdAt: Date.now(), ...toast }
      return { toasts: [next, ...state.toasts].slice(0, 4) }
    }),
  remove: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}))

