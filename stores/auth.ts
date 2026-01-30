import { defineStore } from 'pinia'
import type { User } from '@supabase/supabase-js'

export interface Profile {
  id: string
  role: 'admin' | 'teacher' | 'parent' | 'kitchen' | 'support'
  full_name: string
  email: string
  phone?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    profile: null as Profile | null,
    loading: false
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isAdmin: (state) => state.profile?.role === 'admin',
    isTeacher: (state) => state.profile?.role === 'teacher',
    isParent: (state) => state.profile?.role === 'parent',
    isKitchen: (state) => state.profile?.role === 'kitchen',
    userRole: (state) => state.profile?.role
  },

  actions: {
    setUser(user: User | null) {
      this.user = user
    },

    setProfile(profile: Profile | null) {
      this.profile = profile
    },

    async fetchProfile() {
      if (!this.user || !this.user.id) {
        console.warn('fetchProfile: No user available')
        return
      }

      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', this.user.id)
          .single()

        if (error) {
          console.error('Error fetching profile:', error)
          return
        }

        if (data) {
          console.log('fetchProfile: Successfully loaded profile', { role: data.role, id: data.id })
          this.profile = data
        } else {
          console.warn('fetchProfile: No data returned')
        }
      } catch (e: any) {
        console.error('Error in fetchProfile:', e)
      }
    },

    async logout() {
      const supabase = useSupabaseClient()
      await supabase.auth.signOut()
      this.user = null
      this.profile = null
    }
  }
})
