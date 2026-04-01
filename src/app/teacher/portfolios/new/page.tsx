'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'teacher.portfolios.new'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { usePortfoliosStore } from '@/stores/portfolios'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { PortfolioForm } from '@/components/forms/PortfolioForm'
import { sT } from '@/i18n/sT'

export default function NewPortfolioPage() {
  const { t } = useI18n()

  const router = useRouter()
  const { user } = useAuth()
  const { createPortfolio } = usePortfoliosStore()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (data: any) => {
    if (!user?.id) return
    setSubmitting(true)
    try {
      await createPortfolio(data, user.id)
      alert(t(sT('successTeacherPortfolioCreated')))
      router.push('/teacher/portfolios')
    } catch (e: any) {
      alert(e.message || t(sT('errCreateTeacherPortfolio')))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="mb-8">
        <Link
          href="/teacher/portfolios"
          className="text-sm font-semibold text-[#667eea] mb-2 inline-flex items-center gap-1 hover:translate-x-[-4px] transition-transform"
        >
          ← Zurück zu Portfolios
        </Link>
        <Heading size="xl" className="text-gray-900 mt-2">{t(pT(ROUTE))}</Heading>
        <p className="text-sm text-gray-500 mt-1">Dokumentieren Sie Kunstwerke, Meilensteine und Aktivitäten.</p>
      </div>

      <IOSCard className="p-8">
        <PortfolioForm
          onSubmit={handleSubmit}
          onCancel={() => router.push('/teacher/portfolios')}
          loading={submitting}
        />
      </IOSCard>
    </div>
  )
}
