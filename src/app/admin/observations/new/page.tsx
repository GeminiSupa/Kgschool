'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.observations.new'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useObservationsStore, type Observation } from '@/stores/observations'
import { ObservationForm } from '@/components/forms/ObservationForm'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { sT } from '@/i18n/sT'

export default function AdminObservationsNewPage() {
  const { t } = useI18n()

  const router = useRouter()
  const observationsStore = useObservationsStore()

  const [error, setError] = useState('')

  const handleSubmit = async (data: {
    child_id: string
    observation_date: string
    context: string
    description: string
    development_area: string
    photos: string[]
    videos: string[]
  }) => {
    try {
      setError('')

      const payload: Partial<Observation> = {
        child_id: data.child_id,
        observation_date: data.observation_date,
        context: data.context ? data.context : undefined,
        description: data.description,
        development_area: data.development_area ? data.development_area : undefined,
        photos: data.photos,
        videos: data.videos,
      }

      await observationsStore.createObservation(payload)
      alert(t(sT('successObservationCreated')))
      router.push('/admin/observations')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t(sT('errCreateObservation')))
    }
  }

  const handleCancel = () => {
    router.push('/admin/observations')
  }

  return (
    <div>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push('/admin/observations')}
          className="text-gray-600 hover:text-gray-900 mb-4 inline-block"
        >
          ← Back to Observations
        </button>
        <Heading size="xl">{t(pT(ROUTE))}</Heading>
      </div>

      <IOSCard className="max-w-3xl p-6">
        {error && <ErrorAlert message={error} />}
        <ObservationForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </IOSCard>
    </div>
  )
}

