'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.portfolios.new'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { usePortfoliosStore, type Portfolio } from '@/stores/portfolios'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { PortfolioForm } from '@/components/forms/PortfolioForm'
import { sT } from '@/i18n/sT'

export default function AdminPortfoliosNewPage() {
  const { t } = useI18n()

  const router = useRouter()
  const { user } = useAuth()
  const portfoliosStore = usePortfoliosStore()

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (data: Partial<Portfolio>) => {
    if (!user?.id) {
      setError(t(sT('errNotAuthenticated')))
      return
    }

    setError('')
    setSubmitting(true)
    try {
      await portfoliosStore.createPortfolio(data, user.id)
      alert(t(sT('successPortfolioCreated')))
      router.push('/admin/portfolios')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t(sT('errCreatePortfolioItem')))
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/portfolios')
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleCancel}
          className="text-ui-muted hover:text-slate-900 dark:text-slate-50 mb-4 inline-block"
        >
          ← Back to Portfolios
        </button>
        <Heading size="xl">{t(pT(ROUTE))}</Heading>
      </div>

      <IOSCard className="max-w-3xl p-6">
        {error && <ErrorAlert message={error} />}

        <PortfolioForm
          onSubmit={(data: any) => void handleSubmit(data)}
          onCancel={handleCancel}
          loading={submitting}
        />

        {submitting && (
          <div className="flex justify-center pt-4">
            <LoadingSpinner size="sm" />
          </div>
        )}
      </IOSCard>
    </div>
  )
}

