import { useSupabaseClient, useSupabaseUser } from '#imports'
import type { User } from '@supabase/supabase-js'
import { readonly } from 'vue'

export const useAuth = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const router = useRouter()
  const authStore = useAuthStore()

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    if (data.user) {
      authStore.setUser(data.user)
      await authStore.fetchProfile()
    }
    return data
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    authStore.logout()
    await router.push('/login')
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
    const id = userId || user.value?.id
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
    // Ensure user is loaded
    if (!user.value) {
      // Try to get the current session
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        throw new Error('Not authenticated')
      }
      authStore.setUser(currentUser)
    }

    const userId = user.value?.id || authStore.user?.id
    if (!userId) {
      throw new Error('User ID not found. Please log in again.')
    }

    console.log('Updating profile:', { userId, updates })

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Profile update error:', error)
      throw error
    }
    return data
  }

  const changePassword = async (newPassword: string) => {
    if (!user.value) throw new Error('Not authenticated')

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error
  }

  const uploadAvatar = async (file: File) => {
    if (!user.value) throw new Error('Not authenticated')

    // Validate file
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image')
    }
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('File size must be less than 2 MB')
    }

    // Generate unique filename: {user_id}/avatar.{ext}
    // Make sure the path structure matches the RLS policy
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${user.value.id}/avatar.${fileExt}`

    console.log('Uploading avatar:', { fileName, userId: user.value.id })

    // First, try to delete existing avatar if it exists
    try {
      const { data: existingFiles, error: listError } = await supabase.storage
        .from('avatars')
        .list(user.value.id, {
          limit: 100,
          offset: 0
        })
      
      if (listError) {
        console.warn('Error listing existing files:', listError)
      } else if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles
          .filter(f => f.name && f.name.startsWith('avatar.'))
          .map(f => `${user.value.id}/${f.name}`)
        
        if (filesToDelete.length > 0) {
          console.log('Deleting existing avatars:', filesToDelete)
          const { error: deleteError } = await supabase.storage
            .from('avatars')
            .remove(filesToDelete)
          
          if (deleteError) {
            console.warn('Error deleting existing avatars:', deleteError)
            // Continue anyway - might not exist
          }
        }
      }
    } catch (e) {
      // Ignore errors when deleting - file might not exist
      console.log('No existing avatar to delete or error:', e)
    }

    // Skip bucket existence check - listBuckets() may be blocked by RLS
    // The upload attempt will provide a better error if bucket doesn't exist
    // Since bucket exists (confirmed in dashboard), we proceed directly to upload

    // Upload to storage - use upsert to replace if exists
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true // Use upsert to handle existing files
      })

    if (uploadError) {
      console.error('Upload error details:', {
        error: uploadError,
        fileName,
        userId: user.value.id,
        bucket: 'avatars',
        errorCode: uploadError.statusCode,
        errorMessage: uploadError.message
      })
      
      // More specific error messages
      if (uploadError.message?.includes('row-level security') || uploadError.message?.includes('RLS')) {
        throw new Error('Permission denied. Please run the SQL migration: supabase/migrations/diagnose-and-fix-avatars.sql in Supabase SQL Editor.')
      }
      
      if (uploadError.message?.includes('Bucket not found') || uploadError.statusCode === 404) {
        throw new Error('avatars bucket not found. Please create it in Supabase Dashboard > Storage > New Bucket (name: avatars, public: YES).')
      }
      
      throw new Error(`Failed to upload avatar: ${uploadError.message || 'Unknown error'}`)
    }

    console.log('Upload successful:', uploadData)

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    console.log('Public URL:', urlData.publicUrl)

    // Update profile with avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: urlData.publicUrl })
      .eq('id', user.value.id)

    if (updateError) {
      console.error('Profile update error:', updateError)
      // Try to clean up the uploaded file if profile update fails
      try {
        await supabase.storage.from('avatars').remove([fileName])
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded file:', cleanupError)
      }
      throw new Error(`Failed to update profile: ${updateError.message}`)
    }

    // Refresh profile
    await authStore.fetchProfile()

    return urlData.publicUrl
  }

  const removeAvatar = async () => {
    if (!user.value) throw new Error('Not authenticated')

    // Get current profile to find avatar file path
    const profile = authStore.profile
    if (profile?.avatar_url) {
      // Extract file path from URL (e.g., https://...supabase.co/storage/v1/object/public/avatars/{user_id}/avatar.jpg)
      const urlParts = profile.avatar_url.split('/avatars/')
      if (urlParts.length > 1) {
        const filePath = urlParts[1]
        // Try to delete the file (ignore errors if file doesn't exist)
        await supabase.storage
          .from('avatars')
          .remove([filePath])
      }
    }

    // Update profile to remove avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', user.value.id)

    if (updateError) throw updateError

    // Refresh profile
    await authStore.fetchProfile()
  }

  const hasRole = (role: string): boolean => {
    return authStore.userRole === role
  }

  return {
    user: readonly(user),
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
