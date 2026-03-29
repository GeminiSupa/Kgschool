'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSInput } from '@/components/ui/IOSInput'
import { IOSButton } from '@/components/ui/IOSButton'
import { useI18n } from '@/i18n/I18nProvider'

export default function RegisterPage() {
  const { t } = useI18n()
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
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
      setError('Please fill out all required fields.')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      // In a real implementation, this would call a backend endpoint that:
      // 1. Creates a new Tenant/Kita
      // 2. Creates the User using Supabase Auth
      // 3. Links the User as an 'admin' of the new Kita
      //
      const response = await fetch('/api/auth/register-kita', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Registration failed')
      
      setSuccess(true)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login')
      }, 3000)
      
    } catch (e: any) {
      console.error('Registration error:', e)
      setError(e.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-indigo-50 to-fuchsia-100">
        <IOSCard className="max-w-md w-full p-10 text-center animate-[fadeInUp_0.5s_ease_out]">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🎉</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Registration Successful!</h2>
          <p className="text-gray-600 mb-8">
            Your Kita account has been successfully created. You can now log in to the dashboard to begin creating users and setting up your school.
          </p>
          <div className="text-sm text-indigo-600 flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
            Redirecting to login...
          </div>
        </IOSCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-slate-50 overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-linear-to-br from-indigo-200/40 to-fuchsia-200/40 blur-[80px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-linear-to-tl from-cyan-200/40 to-blue-200/40 blur-[100px]" />

      <div className="relative z-10 w-full max-w-lg mb-12 mt-12">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-xl shadow-sm mb-6 border border-slate-100 hover:scale-105 transition-transform">
            <span className="text-indigo-600 font-bold text-xl">KG</span>
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
            Register your Kita
          </h1>
          <p className="text-slate-600 text-lg">
            Create an owner account and set up your organization
          </p>
        </div>
        
        <IOSCard className="p-8 md:p-10 shadow-2xl shadow-indigo-900/5 border border-white">
          <form onSubmit={handleRegister} className="space-y-6" noValidate>
            
            <div className="pb-6 mb-6 top-1 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Organization Detail</h3>
              <IOSInput
                id="kitaName"
                label="Kindergarten / School Name"
                value={form.kitaName}
                onChange={(e) => setForm(prev => ({ ...prev, kitaName: e.target.value }))}
                placeholder="e.g. Sunshine Daycare"
                required
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Owner Account</h3>
              <IOSInput
                id="fullName"
                label="Full Name"
                value={form.fullName}
                onChange={(e) => setForm(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Jane Doe"
                required
              />

              <IOSInput
                id="email"
                label="Email Address"
                type="email"
                value={form.email}
                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="owner@example.com"
                required
              />

              <IOSInput
                id="phone"
                label="Phone Number (Optional)"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+49 123 456789"
              />

              <IOSInput
                id="password"
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="At least 8 characters"
                required
              />
            </div>

            <IOSButton
              type="submit"
              disabled={loading}
              variant="primary"
              size="large"
              className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Creating Account...
                </span>
              ) : (
                'Create Account & Organization'
              )}
            </IOSButton>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl mt-4 border border-red-100 animate-[fadeIn_0.3s_ease]">
                ⚠️ {error}
              </div>
            )}
            
            <p className="text-xs text-center text-slate-500 mt-6 leading-relaxed">
              By registering, you agree to our <Link href="/privacy" className="underline hover:text-indigo-600">Privacy Policy</Link> and <Link href="/dpa" className="underline hover:text-indigo-600">DPA</Link>.
            </p>
          </form>
        </IOSCard>

        <div className="mt-8 text-center text-slate-600">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-indigo-600 hover:underline">
            Log in to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
