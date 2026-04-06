'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.groups.new'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useGroupsStore } from '@/stores/groups'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { GroupForm } from '@/components/forms/GroupForm'

export default function NewGroupPage() {
  const { t } = useI18n()

  const router = useRouter()
  const { createGroup } = useGroupsStore()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (formData: any) => {
    setSubmitting(true)
    try {
      await createGroup(formData)
      alert('Gruppe erfolgreich angelegt!')
      router.push('/admin/groups')
    } catch (error: any) {
      alert(error.message || 'Fehler beim Erstellen der Gruppe')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="mb-8">
        <Link
          href="/admin/groups"
          className="text-sm font-semibold text-[#667eea] mb-2 inline-flex items-center gap-1 hover:translate-x-[-4px] transition-transform"
        >
          ← Zurück zur Liste
        </Link>
        <Heading size="xl" className="text-slate-900 dark:text-slate-50 mt-2">{t(pT(ROUTE))}</Heading>
        <p className="text-sm text-ui-soft mt-1">Definieren Sie Name, Kapazität und Altersbereich der neuen Gruppe.</p>
      </div>

      <IOSCard className="p-8 shadow-2xl shadow-indigo-900/5 border-black/5">
        <GroupForm
          onSubmit={handleSubmit}
          onCancel={() => router.push('/admin/groups')}
          loading={submitting}
        />
      </IOSCard>
    </div>
  )
}
