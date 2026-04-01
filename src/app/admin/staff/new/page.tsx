'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.staff.new'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { StaffForm } from '@/components/forms/StaffForm'
import { sT } from '@/i18n/sT'

export default function NewStaffPage() {
  const { t } = useI18n()

  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (formData: any) => {
    setSubmitting(true)
    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Fehler beim Erstellen des Personalmitglieds')

      alert('Personalmitglied erfolgreich angelegt!')
      router.push(`/admin/staff/${result.user.id}`)
    } catch (error: any) {
      alert(error.message || t(sT('errSaveStaff')))
      console.error('Error creating staff:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <Link
          href="/admin/staff"
          className="text-sm font-semibold text-[#667eea] mb-2 inline-flex items-center gap-1 hover:translate-x-[-4px] transition-transform"
        >
          ← Zurück zum Personal
        </Link>
        <Heading size="xl" className="text-gray-900 mt-2">{t(pT(ROUTE))}</Heading>
        <p className="text-sm text-gray-500 mt-1">Legen Sie ein neues Konto für einen Mitarbeiter an.</p>
      </div>

      <IOSCard className="p-10 shadow-2xl shadow-indigo-900/5 border-black/5">
        <StaffForm
          onSubmit={handleSubmit}
          onCancel={() => router.push('/admin/staff')}
          loading={submitting}
        />
      </IOSCard>
    </div>
  )
}
