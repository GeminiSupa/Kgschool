'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSInput } from '@/components/ui/IOSInput'
import { IOSButton } from '@/components/ui/IOSButton'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/i18n/I18nProvider'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { AlertCircle, GraduationCap } from 'lucide-react'

export default function LoginPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (loading) return
    
    if (!email.trim()) {
      setError(t('login.emailRequired'))
      return
    }
    
    if (!password) {
      setError(t('login.passwordRequired'))
      return
    }

    setLoading(true)
    setError('')

    try {
      await login(email.trim(), password)
      router.replace('/dashboard')
    } catch (e: any) {
      console.error('Login error:', e)
      setError(e.message || t('login.loginFailed'))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[linear-gradient(135deg,#667eea_0%,#764ba2_50%,#f093fb_100%)] bg-size-[200%_200%] animate-[gradientShift_15s_ease_infinite]">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}} />
      
      <div className="relative z-10 w-full max-w-md animate-[fadeInUp_0.6s_cubic-bezier(0.4,0,0.2,1)]">
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}} />
        
        <IOSCard className="p-8 md:p-10">
          <div className="mb-4 flex justify-end">
            <LanguageSwitcher />
          </div>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-indigo-500 to-fuchsia-500 rounded-2xl mb-4 shadow-lg shadow-indigo-500/25">
              <GraduationCap className="w-8 h-8 text-white" strokeWidth={2} aria-hidden />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50 mb-2 tracking-tight">
              {t('login.title')}
            </h1>
            <p className="text-ui-muted text-sm md:text-base">{t('login.subtitle')}</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-5" noValidate>
            <IOSInput
              id="email"
              label={t('login.emailLabel')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('login.emailPlaceholder')}
              required
              error={error.includes('email') || error.includes('Email') ? error : undefined}
            />

            <IOSInput
              id="password"
              label={t('login.passwordLabel')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('login.passwordPlaceholder')}
              required
              error={error.includes('password') || error.includes('Password') ? error : undefined}
            />

            <IOSButton
              type="submit"
              disabled={loading}
              variant="primary"
              size="large"
              className="w-full mt-6"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/20 border-t-white rounded-full animate-spin"></span>
                  {t('login.submitting')}
                </span>
              ) : (
                <span>{t('login.submit')}</span>
              )}
            </IOSButton>

            <div className="text-center mt-3">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
              >
                {t('login.forgotPassword') || 'Forgot password?'}
              </Link>
            </div>

            {error && !error.includes('email') && !error.includes('Email') && !error.includes('password') && !error.includes('Password') && (
              <div
                className="flex items-center gap-2.5 p-3 px-4 bg-red-500/10 backdrop-blur-[10px] border border-red-500/25 rounded-xl text-red-600 dark:text-red-400 text-sm animate-[shake_0.4s_ease]"
                role="alert"
              >
                <style dangerouslySetInnerHTML={{__html: `
                  @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                  }
                `}} />
                <AlertCircle className="w-5 h-5 shrink-0" strokeWidth={2} aria-hidden />
                <span>{error}</span>
              </div>
            )}
          </form>

          <div className="mt-8 text-center">
            <Link href="/" className="text-[#6e6e73] text-sm no-underline transition-all duration-200 inline-block hover:text-[#1d1d1f] hover:-translate-x-[3px]">
              ← {t('common.backToHome')}
            </Link>
            <div className="mt-3 flex justify-center gap-4 text-xs text-ui-soft">
              <Link href="/privacy" className="hover:text-slate-700 dark:text-slate-200">
                {t('common.privacy')}
              </Link>
              <Link href="/imprint" className="hover:text-slate-700 dark:text-slate-200">
                {t('common.imprint')}
              </Link>
              <Link href="/security" className="hover:text-slate-700 dark:text-slate-200">
                {t('common.security')}
              </Link>
            </div>
          </div>
        </IOSCard>
      </div>
    </div>
  )
}
