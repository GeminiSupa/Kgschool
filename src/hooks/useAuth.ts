'use client'

import { useAuthStore } from '@/stores/auth'
import { createClient } from '@/utils/supabase/client'

export const useAuth = () => {
  const supabase = createClient()
  const { user, profile, setUser, fetchProfile, logout: storeLogout, authHydrated } = useAuthStore()

  const login = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password
    })
    if (error) throw error
    if (data.user) {
      setUser(data.user)
      await fetchProfile()
    }
    return data
  }

  const logout = async () => {
    await storeLogout()
    if (typeof window !== 'undefined') {
      window.location.assign('/login')
    }
  }

  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    if (error) throw error
    return data
  }

  const getProfile = async (userId?: string): Promise<any> => {
    const id = userId || user?.id
    if (!id) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  const updateProfile = async (updates: Record<string, any>) => {
    if (!user) {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) throw new Error('Not authenticated')
      setUser(currentUser)
    }

    const userId = user?.id
    if (!userId) throw new Error('User ID not found. Please log in again.')

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    
    // Refresh local store profile
    await fetchProfile()
    return data
  }

  const changePassword = async (newPassword: string) => {
    if (!user) throw new Error('Not authenticated')
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  const uploadAvatar = async (file: File) => {
    if (!user) throw new Error('Not authenticated')
    if (!file.type.startsWith('image/')) throw new Error('File must be an image')
    if (file.size > 2 * 1024 * 1024) throw new Error('File size must be less than 2 MB')

    const fileExt = file.name.split('.').pop() || 'jpg'
    const timestamp = Date.now()
    const fileName = `${user.id}/avatar_${timestamp}.${fileExt}`

    try {
      // List and remove all existing files in the user's avatar folder to keep it clean
      const { data: existingFiles } = await supabase.storage.from('avatars').list(user.id)
      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(f => `${user.id}/${f.name}`)
        await supabase.storage.from('avatars').remove(filesToDelete)
      }
    } catch (e) {
      console.log('Cleanup error (non-critical):', e)
    }

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { cacheControl: '0', upsert: true })

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        avatar_url: publicUrl,
        updated_at: new Date().toISOString() 
      })
      .eq('id', user.id)

    if (updateError) throw new Error(`Failed to update profile: ${updateError.message}`)

    await fetchProfile()
    return publicUrl
  }

  const removeAvatar = async () => {
    if (!user) throw new Error('Not authenticated')

    if (profile?.avatar_url) {
      const urlParts = profile.avatar_url.split('/avatars/')
      if (urlParts.length > 1) {
        const filePath = urlParts[1]
        await supabase.storage.from('avatars').remove([filePath])
      }
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', user.id)

    if (updateError) throw updateError
    await fetchProfile()
  }

  const hasRole = (role: string): boolean => {
    return profile?.role === role
  }

  return {
    user,
    profile,
    /** True until first session + profile resolution (ClientAuthHydrator + fetchProfile). */
    loading: !authHydrated,
    login,
    logout,
    signUp,
    changePassword,
    uploadAvatar,
    removeAvatar,
    getProfile,
    updateProfile,
    hasRole
  }
}
