'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { useAuth } from '@/hooks/useAuth'

function getInitials(fullName?: string | null) {
  const name = fullName || ''
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatRole(role: string) {
  const roles: Record<string, string> = {
    admin: 'Administrator',
    teacher: 'Erzieher/in',
    parent: 'Elternteil',
    kitchen: 'Küche',
    support: 'Support',
  }
  return roles[role] || role
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, profile, loading, updateProfile, changePassword, uploadAvatar, removeAvatar } = useAuth()

  const avatarInputRef = useRef<HTMLInputElement | null>(null)

  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState('')
  const [updateSuccess, setUpdateSuccess] = useState(false)

  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone: (profile as any)?.phone || '',
  })

  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState('')

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  })
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const roleLabel = useMemo(() => (profile?.role ? formatRole(profile.role) : ''), [profile?.role])

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [loading, user, router])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setUpdateError('')
    setUpdateSuccess(false)

    try {
      if (!form.full_name || form.full_name.trim() === '') {
        setUpdateError('Vollständiger Name ist erforderlich')
        return
      }

      await updateProfile({
        full_name: form.full_name.trim(),
        phone: form.phone?.trim() || null,
      })

      setUpdateSuccess(true)
      setTimeout(() => setUpdateSuccess(false), 3000)
    } catch (e: any) {
      setUpdateError(e?.message || 'Profil konnte nicht aktualisiert werden')
    } finally {
      setUpdating(false)
    }
  }

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingAvatar(true)
    setAvatarError('')

    try {
      await uploadAvatar(file)
      // Keep local state in sync
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    } catch (e: any) {
      setAvatarError(e?.message || 'Avatar konnte nicht hochgeladen werden')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true)
    setAvatarError('')

    try {
      await removeAvatar()
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    } catch (e: any) {
      setAvatarError(e?.message || 'Avatar konnte nicht entfernt werden')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwörter stimmen nicht überein')
      return
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Passwort muss mindestens 6 Zeichen lang sein')
      return
    }

    setChangingPassword(true)
    setPasswordError('')
    setPasswordSuccess(false)

    try {
      await changePassword(passwordForm.newPassword)
      setPasswordSuccess(true)
      setPasswordForm({ newPassword: '', confirmPassword: '' })
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (e: any) {
      setPasswordError(e?.message || 'Passwort konnte nicht geändert werden')
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading || !profile || !user) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-6">
        <Heading size="xl" className="mb-1">
          Mein Profil
        </Heading>
        <p className="text-sm text-gray-500">Verwalten Sie Ihre persönlichen Informationen und Kontoeinstellungen</p>
      </div>

      {updateError && <ErrorAlert message={updateError} />}

      <div className="space-y-6">
        <IOSCard className="p-6">
          <Heading size="md" className="mb-6">
            Profilbild
          </Heading>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative">
              {profile.avatar_url ? (
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg ring-2 ring-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-lg ring-2 ring-gray-200">
                  {getInitials(profile.full_name)}
                </div>
              )}

              {uploadingAvatar && (
                <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                </div>
              )}

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <div className="flex-1 w-full sm:w-auto">
              <IOSButton
                type="button"
                variant="primary"
                className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-white"
                disabled={uploadingAvatar}
                onClick={() => avatarInputRef.current?.click()}
              >
                {uploadingAvatar ? '⏳ Wird hochgeladen...' : '📷 Bild ändern'}
              </IOSButton>

              <p className="text-xs text-gray-500 mt-3">JPG, PNG oder GIF. Max. Größe 2MB.</p>

              {profile.avatar_url && (
                <IOSButton
                  type="button"
                  variant="secondary"
                  className="mt-3 w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-red-600 border-red-100"
                  disabled={uploadingAvatar}
                  onClick={handleRemoveAvatar}
                >
                  🗑️ Bild entfernen
                </IOSButton>
              )}
            </div>
          </div>

          {avatarError && <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 text-red-800 rounded-xl text-sm">{avatarError}</div>}
        </IOSCard>

        <IOSCard className="p-6">
          <Heading size="md" className="mb-6">
            Profilinformationen
          </Heading>

          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vollständiger Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.full_name}
                  onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Ihr vollständiger Name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">E-Mail</label>
                <input
                  value={profile.email}
                  type="email"
                  disabled
                  className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-xl text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-2">E-Mail kann nicht geändert werden</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Telefon</label>
                <input
                  value={form.phone || ''}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  type="tel"
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="+49 123 456 7890"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Rolle</label>
                <div className="relative">
                  <input
                    value={roleLabel}
                    type="text"
                    disabled
                    className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-xl text-gray-600 cursor-not-allowed capitalize"
                  />
                  <span
                    className={[
                      'absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-semibold rounded-full',
                      profile.role === 'admin'
                        ? 'bg-purple-500 text-white'
                        : profile.role === 'teacher'
                          ? 'bg-blue-500 text-white'
                          : profile.role === 'parent'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-500 text-white',
                    ].join(' ')}
                  >
                    {profile.role}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Rolle kann nicht geändert werden</p>
              </div>
            </div>

            {updateError && (
              <div className="p-4 bg-red-50 border-2 border-red-200 text-red-800 rounded-xl text-sm">⚠️ {updateError}</div>
            )}

            {updateSuccess && (
              <div className="p-4 bg-green-50 border-2 border-green-200 text-green-800 rounded-xl text-sm">✅ Profil erfolgreich aktualisiert!</div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <IOSButton
                type="submit"
                disabled={updating}
                variant="primary"
                className="px-6 py-2.5 text-sm font-semibold text-white"
              >
                {updating ? '⏳ Wird gespeichert...' : '✅ Änderungen speichern'}
              </IOSButton>
            </div>
          </form>
        </IOSCard>

        <IOSCard className="p-6">
          <Heading size="md" className="mb-6">
            Passwort ändern
          </Heading>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Neues Passwort <span className="text-red-500">*</span>
              </label>
              <input
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                type="password"
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Neues Passwort eingeben"
                disabled={changingPassword}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Neues Passwort bestätigen <span className="text-red-500">*</span>
              </label>
              <input
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                type="password"
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Neues Passwort bestätigen"
                disabled={changingPassword}
              />
            </div>

            {passwordError && <div className="p-4 bg-red-50 border-2 border-red-200 text-red-800 rounded-xl text-sm">⚠️ {passwordError}</div>}
            {passwordSuccess && <div className="p-4 bg-green-50 border-2 border-green-200 text-green-800 rounded-xl text-sm">✅ Passwort erfolgreich geändert!</div>}

            <IOSButton
              type="button"
              disabled={changingPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
              variant="primary"
              className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-white"
              onClick={handleChangePassword}
            >
              {changingPassword ? '⏳ Wird geändert...' : '🔒 Passwort ändern'}
            </IOSButton>
          </div>
        </IOSCard>

        <IOSCard className="p-6">
          <Heading size="md" className="mb-6">
            Kontoinformationen
          </Heading>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Benutzer-ID</label>
              <input
                value={profile.id}
                type="text"
                disabled
                className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-xl text-gray-600 cursor-not-allowed font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Erstellt am</label>
                <input
                  value={profile.created_at ? formatDate(profile.created_at) : ''}
                  type="text"
                  disabled
                  className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-xl text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Zuletzt aktualisiert</label>
                <input
                  value={profile.updated_at ? formatDate(profile.updated_at) : ''}
                  type="text"
                  disabled
                  className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-xl text-gray-600 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </IOSCard>
      </div>
    </div>
  )
}

