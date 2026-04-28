'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSInput } from '@/components/ui/IOSInput'
import { IOSButton } from '@/components/ui/IOSButton'
import { useI18n } from '@/i18n/I18nProvider'
import { sT } from '@/i18n/sT'
import { useAuth } from '@/hooks/useAuth'

export default function RegisterPage() {
  const { t } = useI18n()
  const router = useRouter()
  const { login } = useAuth()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [autoLoginHint, setAutoLoginHint] = useState('')

  const [form, setForm] = useState({
    kitaName: '',
    fullName: '',
    email: '',
    password: '',
    phone: '',
  })

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.kitaName || !form.fullName || !form.email || !form.password) {
      setError(t(sT('validationRequiredFields')))
      return
    }

    setLoading(true)
    setError('')
    setAutoLoginHint('')

    try {
      const response = await fetch('/api/auth/register-kita', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.message || t(sT('registrationFailed')))

      const emailNorm = form.email.trim().toLowerCase()
      try {
        await login(emailNorm, form.password)
        router.replace('/dashboard')
        return
      } catch (loginErr) {
        console.error('Post-registration sign-in:', loginErr)
        const msg =
          loginErr instanceof Error ? loginErr.message : t(sT('registrationFailed'))
        setAutoLoginHint(msg)
        setSuccess(true)
        setTimeout(() => {
          router.push('/login')
        }, 6000)
      }
    } catch (e: unknown) {
      console.error('Registration error:', e)
      const msg = e instanceof Error ? e.message : t(sT('registrationFailedRetry'))
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-aura-primary/10 to-aura-accent/20">
        <IOSCard className="max-w-md w-full p-10 text-center animate-[fadeInUp_0.5s_ease_out]">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl" aria-hidden>
              🎉
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4 font-display">{t(sT('registrationSuccessTitle'))}</h2>
          <p className="text-ui-muted mb-8">{t(sT('registrationSuccessBody'))}</p>
          {autoLoginHint ? (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 text-left">
              {t(sT('registrationAutoLoginFailed'))}{' '}
              <span className="font-medium">{autoLoginHint}</span>
            </p>
          ) : null}
          <div className="text-sm text-aura-primary flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-aura-primary border-t-transparent rounded-full animate-spin" aria-hidden />
            {t(sT('redirectingLogin'))}
          </div>
        </IOSCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-slate-50 overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] rounded-full bg-linear-to-br from-aura-primary/20 to-aura-pink/20 blur-[80px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] rounded-full bg-linear-to-tl from-aura-cyan/20 to-aura-accent/20 blur-[100px]" />

      <div className="relative z-10 w-full max-w-lg mb-12 mt-12">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-xl shadow-sm mb-6 border border-slate-100 hover:scale-105 transition-transform"
          >
            <Image src="/brand/kid-cloud-logo.png" alt="Kid Cloud logo" width={48} height={48} className="w-12 h-12 object-contain" />
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight font-display">{t(sT('registerPageTitle'))}</h1>
          <p className="text-slate-600 text-lg">{t(sT('registerSubtitle'))}</p>
        </div>

        <IOSCard className="p-8 md:p-10 shadow-2xl shadow-black/5 border border-white">
          <form onSubmit={handleRegister} className="space-y-6" noValidate>
            <div className="pb-6 mb-6 top-1 border-b border-slate-100">
              <h3 className="text-sm font-bold text-ui-soft uppercase tracking-widest mb-4">{t(sT('orgDetailSection'))}</h3>
              <IOSInput
                id="kitaName"
                label={t(sT('kitaNameLabel'))}
                value={form.kitaName}
                onChange={(e) => setForm((prev) => ({ ...prev, kitaName: e.target.value }))}
                placeholder={t(sT('kitaNamePlaceholder'))}
                required
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-ui-soft uppercase tracking-widest mb-2">{t(sT('ownerAccountSection'))}</h3>
              <IOSInput
                id="fullName"
                label={t(sT('fullNameLabel'))}
                value={form.fullName}
                onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                placeholder={t(sT('fullNamePlaceholder'))}
                required
              />

              <IOSInput
                id="email"
                label={t(sT('emailLabel'))}
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder={t(sT('emailPlaceholder'))}
                required
              />

              <IOSInput
                id="phone"
                label={t(sT('phoneOptionalLabel'))}
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+49 123 456789"
              />

              <IOSInput
                id="password"
                label={t(sT('passwordLabel'))}
                type="password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder={t(sT('passwordPlaceholder'))}
                required
              />
            </div>

            <IOSButton type="submit" disabled={loading} variant="primary" size="large" className="w-full mt-8 text-base">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t(sT('creatingAccount'))}
                </span>
              ) : (
                t(sT('createAccountOrgBtn'))
              )}
            </IOSButton>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl mt-4 border border-red-100 animate-[fadeIn_0.3s_ease]" role="alert">
                {error}
              </div>
            )}

            <p className="text-xs text-center text-slate-500 mt-6 leading-relaxed">
              {t(sT('registerAgreePrefix'))}{' '}
              <Link href="/privacy" className="underline hover:text-aura-primary">
                {t('common.privacy')}
              </Link>{' '}
              {t(sT('registerAgreeAnd'))}{' '}
              <Link href="/dpa" className="underline hover:text-aura-primary">
                {t('common.dpa')}
              </Link>
              .
            </p>
          </form>
        </IOSCard>

        <div className="mt-8 text-center text-slate-600">
          {t(sT('alreadyHaveAccount'))}{' '}
          <Link href="/login" className="font-semibold text-aura-primary hover:underline">
            {t(sT('logInToDashboardLink'))}
          </Link>
        </div>
      </div>
    </div>
  )
}
