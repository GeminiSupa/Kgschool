'use client'

import React, { useState, useEffect } from 'react'
import { IOSInput } from '@/components/ui/IOSInput'
import { IOSButton } from '@/components/ui/IOSButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ImageUpload } from '@/components/common/ImageUpload'

interface StaffFormProps {
  staff?: any
  onSubmit: (data: any) => void
  onCancel: () => void
  loading?: boolean
}

export function StaffForm({ staff, onSubmit, onCancel, loading }: StaffFormProps) {
  const isEdit = !!staff
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    full_name: staff?.full_name || '',
    email: staff?.email || '',
    password: '',
    password_confirm: '',
    role: staff?.role || '',
    phone: staff?.phone || '',
    avatar_url: staff?.avatar_url || ''
  })

  const isFormValid = (() => {
    if (!form.full_name || !form.email || !form.role) return false
    if (!isEdit) {
      if (!form.password || form.password.length < 6) return false
      if (form.password !== form.password_confirm) return false
    }
    return true
  })()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) {
      setError('Bitte füllen Sie alle Pflichtfelder korrekt aus.')
      return
    }
    setError('')
    
    const submitData = { ...form }
    if (isEdit) {
      delete (submitData as any).password
      delete (submitData as any).password_confirm
    } else {
      delete (submitData as any).password_confirm
    }
    onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-center pb-4">
        <ImageUpload 
            bucket="avatars"
            label="Profilbild"
            aspectRatio="square"
            onUploadSuccess={(url) => setForm({ ...form, avatar_url: url })}
            currentImageUrl={form.avatar_url}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <IOSInput
          id="full_name"
          label="Vollständiger Name *"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          required
        />
        <IOSInput
          id="email"
          label="Email Adresse *"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
      </div>

      {!isEdit && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <IOSInput
            id="password"
            label="Passwort *"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            placeholder="Min. 6 Zeichen"
          />
          <IOSInput
            id="password_confirm"
            label="Passwort bestätigen *"
            type="password"
            value={form.password_confirm}
            onChange={(e) => setForm({ ...form, password_confirm: e.target.value })}
            required
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[14px] font-semibold text-[#1d1d1f] mb-2 tracking-[0.3px]">Rolle *</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            required
            className="w-full px-4 py-3 bg-white/90 backdrop-blur-[10px] border border-black/10 rounded-[12px] text-[#1d1d1f] text-base transition-all outline-none focus:border-[#667eea]/50 focus:shadow-[0_0_0_4px_rgba(102,126,234,0.2)]"
          >
            <option value="">Rolle wählen</option>
            <option value="teacher">Erzieher</option>
            <option value="kitchen">Küche</option>
            <option value="support">Support</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
        <IOSInput
          id="phone"
          label="Telefonnummer"
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100">
          ⚠️ {error}
        </div>
      )}

      <div className="flex gap-4 justify-end pt-6 border-t border-black/5">
        <IOSButton type="button" variant="secondary" onClick={onCancel} className="px-8 py-2.5 font-bold">
          Abbrechen
        </IOSButton>
        <IOSButton type="submit" variant="primary" disabled={loading || !isFormValid} className="px-10 py-2.5 font-bold shadow-xl shadow-blue-500/20">
          {loading ? <LoadingSpinner size="sm" /> : (isEdit ? 'Aktualisieren' : 'Mitarbeiter anlegen')}
        </IOSButton>
      </div>
    </form>
  )
}
