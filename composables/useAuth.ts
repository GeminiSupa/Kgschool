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
    // Bucket allows 3MB, but we'll limit to 2MB for consistency
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

    // Note: listBuckets() may be blocked by RLS, so we skip the check
    // The upload attempt will provide accurate error messages if bucket doesn't exist
    // Since you confirmed the bucket exists, we proceed directly to upload
    console.log('Attempting upload to avatars bucket...')

    // Upload to storage - use upsert to replace if exists
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true // Use upsert to handle existing files
      })

    if (uploadError) {
      // Log full error details for debugging
      console.error('❌ Upload error details:', {
        error: uploadError,
        errorName: uploadError.name,
        errorMessage: uploadError.message,
        errorCode: uploadError.statusCode,
        fileName,
        userId: user.value.id,
        bucket: 'avatars',
        fullError: JSON.stringify(uploadError, null, 2)
      })
      
      // More specific error messages based on actual error
      const errorMsg = (uploadError.message || '').toLowerCase()
      const errorCode = uploadError.statusCode
      
      if (errorMsg.includes('row-level security') || errorMsg.includes('rls') || errorMsg.includes('policy') || errorMsg.includes('permission') || errorMsg.includes('new row violates')) {
        // Log detailed info for debugging
        console.error('❌ RLS Error Debug Info:', {
          fileName,
          userId: user.value.id,
          userIdType: typeof user.value.id,
          expectedPath: `${user.value.id}/avatar.${file.name.split('.').pop()}`,
          policyCheck: `First folder should match: ${user.value.id}`,
          fullError: uploadError,
          errorMessage: uploadError.message,
          errorName: uploadError.name,
          errorCode: uploadError.statusCode
        })
        
        // Get current session to verify auth
        const { data: { session } } = await supabase.auth.getSession()
        console.error('Current session:', {
          hasSession: !!session,
          userId: session?.user?.id,
          sessionUserId: session?.user?.id,
          matches: session?.user?.id === user.value.id
        })
        
        throw new Error(`❌ Permission denied (RLS error).\n\nError: ${uploadError.message}\n\nDebug Info (check console):\n- File path: ${fileName}\n- User ID: ${user.value.id}\n- Policy expects: First folder = user ID\n\nTry:\n1. Run FINAL_AVATAR_FIX.sql (alternative policy syntax)\n2. Log out and log back in (refresh session)\n3. Check browser console for full debug details`)
      }
      
      if (errorMsg.includes('Bucket not found') || errorCode === 404 || errorMsg.includes('not found') || errorMsg.includes('does not exist')) {
        throw new Error('❌ "avatars" bucket not found!\n\nPlease create it:\n1. Go to Supabase Dashboard > Storage\n2. Click "New bucket"\n3. Name: "avatars" (exactly this)\n4. Public bucket: YES ✅ (must be checked)\n5. Click "Create bucket"\n\nThen run the SQL migration for RLS policies.')
      }
      
      // Generic error with full details
      throw new Error(`❌ Upload failed: ${errorMsg || 'Unknown error'}\n\nError Code: ${errorCode || 'N/A'}\n\nTroubleshooting:\n1. Verify "avatars" bucket exists and is PUBLIC ✅\n2. Check RLS policies are set up (run SQL migration)\n3. Ensure you are logged in\n4. Check browser console for more details`)
    }

    console.log('Upload successful:', uploadData)

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    console.log('Public URL:', urlData.publicUrl)

    // Get user ID directly from session to ensure it's available
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !currentUser) {
      console.error('Failed to get user:', userError)
      // Try to clean up the uploaded file
      try {
        await supabase.storage.from('avatars').remove([fileName])
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded file:', cleanupError)
      }
      throw new Error('User not authenticated. Please log in again.')
    }

    const userId = currentUser.id
    console.log('Updating profile with user ID:', userId)

    // Update profile directly with the confirmed user ID
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: urlData.publicUrl })
      .eq('id', userId)

    if (updateError) {
      console.error('Profile update error:', updateError)
      // Try to clean up the uploaded file if profile update fails
      try {
        await supabase.storage.from('avatars').remove([fileName])
        console.log('Cleaned up uploaded file due to profile update failure')
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded file:', cleanupError)
      }
      throw new Error(`Failed to update profile: ${updateError.message}`)
    }

    console.log('Profile updated successfully with avatar URL')

    // Refresh profile to get updated avatar URL
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
