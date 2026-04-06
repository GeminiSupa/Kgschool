'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'teacher.observations.new'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useObservationsStore, type Observation } from '@/stores/observations'
import { ObservationForm } from '@/components/forms/ObservationForm'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { sT } from '@/i18n/sT'

export default function TeacherObservationsNewPage() {
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
      alert(t(sT('successTeacherObservationCreated')))
      router.push('/teacher/observations')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t(sT('errCreateObservation')))
    }
  }

  const handleCancel = () => {
    router.push('/teacher/observations')
  }

  return (
    <div>
      <div className="mb-6">
        <button
          type="button"
          onClick={handleCancel}
          className="text-ui-muted hover:text-slate-900 dark:text-slate-50 mb-4 inline-block"
        >
          ← Zurück zu Beobachtungen
        </button>
        <Heading size="xl">{t(pT(ROUTE))}</Heading>
        <p className="text-sm text-ui-muted mt-1">Dokumentieren Sie die Entwicklung eines Kindes</p>
      </div>

      <IOSCard className="max-w-3xl p-6">
        {error && <ErrorAlert message={error} />}
        <ObservationForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </IOSCard>
    </div>
  )
}

