'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSInput } from '@/components/ui/IOSInput'
import { IOSButton } from '@/components/ui/IOSButton'
import { createClient } from '@/utils/supabase/client'
import { KeyRound, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    setLoading(true)
    setError('')

    const { error: sbError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/auth/reset-password` }
    )

    setLoading(false)

    if (sbError) {
      setError(sbError.message)
    } else {
      setSent(true)
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
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />

      <div className="relative z-10 w-full max-w-md animate-[fadeInUp_0.6s_cubic-bezier(0.4,0,0.2,1)]">
        <IOSCard className="p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-indigo-500 to-fuchsia-500 rounded-2xl mb-4 shadow-lg shadow-indigo-500/25">
              {sent ? (
                <CheckCircle className="w-8 h-8 text-white" strokeWidth={2} aria-hidden />
              ) : (
                <KeyRound className="w-8 h-8 text-white" strokeWidth={2} aria-hidden />
              )}
            </div>

            {sent ? (
              <>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2 tracking-tight">
                  Check your email
                </h1>
                <p className="text-ui-muted text-sm md:text-base">
                  We sent a password reset link to <strong>{email}</strong>. Check your inbox and spam folder.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2 tracking-tight">
                  Forgot password?
                </h1>
                <p className="text-ui-muted text-sm md:text-base">
                  Enter your email and we'll send you a reset link.
                </p>
              </>
            )}
          </div>

          {!sent && (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <IOSInput
                id="email"
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />

              {error && (
                <div
                  className="flex items-center gap-2.5 p-3 px-4 bg-red-500/10 border border-red-500/25 rounded-xl text-red-600 text-sm"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <IOSButton
                type="submit"
                disabled={loading}
                variant="primary"
                size="large"
                className="w-full mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-black/20 border-t-white rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  'Send reset link'
                )}
              </IOSButton>
            </form>
          )}

          <div className="mt-8 text-center">
            <Link
              href="/login"
              className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
            >
              ← Back to login
            </Link>
          </div>
        </IOSCard>
      </div>
    </div>
  )
}
