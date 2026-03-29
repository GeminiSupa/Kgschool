'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.children.new'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { ChildForm } from '@/components/forms/ChildForm'
import { useKita } from '@/hooks/useKita'

export default function NewChildPage() {
  const { t } = useI18n()

  const router = useRouter()
  const supabase = createClient()
  const { getUserKitaId } = useKita()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (formData: any) => {
    setSubmitting(true)
    try {
      const kitaId = await getUserKitaId()
      
      const { data, error } = await supabase
        .from('children')
        .insert([{
          ...formData,
          kita_id: kitaId || undefined
        }])
        .select()
        .single()

      if (error) throw error
      alert('Kind erfolgreich angemeldet!')
      router.push(`/admin/children/${data.id}`)
    } catch (error: any) {
      console.error('Error creating child:', error)
      alert(error.message || 'Fehler beim Erstellen des Profils')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <Link
          href="/admin/children"
          className="text-sm font-semibold text-[#667eea] mb-2 inline-flex items-center gap-1 hover:translate-x-[-4px] transition-transform"
        >
          ← Zurück zur Liste
        </Link>
        <Heading size="xl" className="text-gray-900 mt-2">{t(pT(ROUTE))}</Heading>
        <p className="text-sm text-gray-500 mt-1">Erfassen Sie ein neues Kind im System und weisen Sie es einer Gruppe zu.</p>
      </div>

      <IOSCard className="p-8 shadow-2xl shadow-indigo-900/5 border-black/5">
        <ChildForm
          onSubmit={handleSubmit}
          onCancel={() => router.push('/admin/children')}
          loading={submitting}
        />
      </IOSCard>
    </div>
  )
}
