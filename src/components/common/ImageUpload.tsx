'use client'

import React, { useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { LoadingSpinner } from './LoadingSpinner'

interface ImageUploadProps {
  bucket: 'avatars' | 'lunch-photos'
  onUploadSuccess: (url: string) => void
  currentImageUrl?: string
  label?: string
  aspectRatio?: 'square' | 'video'
}

export function ImageUpload({ 
  bucket, 
  onUploadSuccess, 
  currentImageUrl, 
  label = 'Bild hochladen',
  aspectRatio = 'video'
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentImageUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)

    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const fileExt = file.name.split('.').pop()
      // Use date/timestamp to avoid caching issues and collisions
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      onUploadSuccess(publicUrl)
    } catch (error: any) {
      console.error('Upload error:', error)
      alert('Upload fehlgeschlagen: ' + (error.message || 'Unbekannter Fehler'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {label && <label className="block text-[11px] font-black text-ui-soft uppercase tracking-widest ml-1">{label}</label>}
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer group overflow-hidden border-2 border-dashed border-black/5 rounded-[24px] transition-all hover:border-indigo-400/50 hover:bg-indigo-50/30 bg-gray-50/50 ${
          aspectRatio === 'square' ? 'aspect-square w-32' : 'aspect-video w-full'
        }`}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 group-hover:text-indigo-400 transition-colors">
            <span className="text-3xl mb-3">📸</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Klicken zum Upload</span>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center rounded-[24px] z-20">
            <LoadingSpinner size="md" color="border-white" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 transition-colors z-10" />
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
      <p className="text-[10px] text-ui-soft font-medium ml-1 italic">* Max. Dateigröße 2MB. Erlaubte Formate: JPG, PNG, WEBP.</p>
    </div>
  )
}
