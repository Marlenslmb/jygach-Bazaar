import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserRole, City } from '@/api/types'

interface AppState {
  // Текущая роль (для прототипа можно переключать вручную)
  role: UserRole
  setRole: (role: UserRole) => void

  // Выбранный город
  city: City
  setCity: (city: City) => void

  // Избранное
  favorites: { masters: string[]; materials: string[]; portfolio: string[] }
  toggleFavorite: (
    type: 'masters' | 'materials' | 'portfolio',
    id: string
  ) => void

  // Toast (легковесные уведомления)
  toast: { message: string; id: number } | null
  showToast: (message: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      role: 'customer',
      setRole: (role) => set({ role }),

      city: 'Бишкек',
      setCity: (city) => set({ city }),

      favorites: { masters: [], materials: [], portfolio: [] },
      toggleFavorite: (type, id) => {
        const list = get().favorites[type]
        const next = list.includes(id)
          ? list.filter((x) => x !== id)
          : [...list, id]
        set({ favorites: { ...get().favorites, [type]: next } })
      },

      toast: null,
      showToast: (message) => {
        set({ toast: { message, id: Date.now() } })
        setTimeout(() => {
          if (get().toast?.message === message) set({ toast: null })
        }, 2400)
      },
    }),
    {
      name: 'jygach-bazaar-storage',
      partialize: (state) => ({
        role: state.role,
        city: state.city,
        favorites: state.favorites,
      }),
    }
  )
)
