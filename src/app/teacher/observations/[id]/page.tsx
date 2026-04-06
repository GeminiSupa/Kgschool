'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'teacher.observations.id'

import React, { useEffect, useState, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useObservationsStore } from '@/stores/observations'
import { useChildrenStore } from '@/stores/children'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { ObservationForm } from '@/components/forms/ObservationForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function TeacherObservationDetailPage({ params }: PageProps) {
  const { t } = useI18n()

  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { observations, loading, error, fetchObservations, updateObservation, deleteObservation } = useObservationsStore()
  const { children, fetchChildren } = useChildrenStore()

  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchChildren()
    fetchObservations()
  }, [fetchChildren, fetchObservations])

  const observation = observations.find(o => o.id === id)

  const getChildName = (childId: string) => {
    const child = (children || []).find((c: any) => c.id === childId)
    return child ? `${child.first_name} ${child.last_name}` : childId
  }

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleUpdate = async (data: any) => {
    setSubmitting(true)
    try {
      await updateObservation(id, data)
      setIsEditing(false)
      // Refresh observations is handled by the store (ideally)
    } catch (e: any) {
      console.error('Error updating observation:', e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Beobachtung wirklich löschen?')) return
    try {
      await deleteObservation(id)
      router.push('/teacher/observations')
    } catch (e: any) {
      console.error('Error deleting observation:', e)
    }
  }

  if (loading && !observation) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4">
        <ErrorAlert message={error.message || 'Fehler beim Laden der Beobachtung'} />
        <Link href="/teacher/observations" className="mt-4 inline-block text-[#667eea] font-medium">
          ← Zurück zur Übersicht
        </Link>
      </div>
    )
  }

  if (!observation) {
    return (
      <div className="max-w-2xl mx-auto py-24 px-4 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <Heading size="lg">Beobachtung nicht gefunden</Heading>
        <Link href="/teacher/observations" className="mt-4 inline-block text-[#667eea] font-medium font-fiori">
          ← Zurück zur Übersicht
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link
            href="/teacher/observations"
            className="text-sm font-semibold text-[#667eea] mb-2 inline-flex items-center gap-1 hover:translate-x-[-4px] transition-transform"
          >
            ← Zurück zu Beobachtungen
          </Link>
          <Heading size="xl" className="text-slate-900 dark:text-slate-50">{t(pT(ROUTE))}</Heading>
        </div>
        {!isEditing && (
          <div className="flex items-center gap-2">
            <IOSButton
              variant="secondary"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm flex items-center gap-2"
            >
              ✏️ Bearbeiten
            </IOSButton>
            <IOSButton
              variant="secondary"
              onClick={handleDelete}
              className="px-4 py-2 text-sm text-red-500 hover:text-red-600 flex items-center gap-2"
            >
              🗑️ Löschen
            </IOSButton>
          </div>
        )}
      </div>

      <IOSCard className={isEditing ? 'p-6' : 'p-0 overflow-hidden'}>
        {isEditing ? (
          <ObservationForm
            initialData={observation}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
            loading={submitting}
          />
        ) : (
          <div className="divide-y divide-black/5">
            <div className="p-6">
              <h3 className="text-xs font-bold text-black/40 uppercase tracking-wider mb-2">Kind</h3>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-50">{getChildName(observation.child_id)}</p>
            </div>

            <div className="p-6">
              <h3 className="text-xs font-bold text-black/40 uppercase tracking-wider mb-2">Datum</h3>
              <p className="text-base font-semibold text-slate-800 dark:text-slate-100">{formatDate(observation.observation_date)}</p>
            </div>

            {observation.development_area && (
              <div className="p-6">
                <h3 className="text-xs font-bold text-black/40 uppercase tracking-wider mb-2">Entwicklungsbereich</h3>
                <span className="inline-flex px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100">
                  {observation.development_area}
                </span>
              </div>
            )}

            {observation.context && (
              <div className="p-6">
                <h3 className="text-xs font-bold text-black/40 uppercase tracking-wider mb-2">Kontext</h3>
                <p className="text-base text-slate-700 dark:text-slate-200 italic font-medium">"{observation.context}"</p>
              </div>
            )}

            <div className="p-6">
              <h3 className="text-xs font-bold text-black/40 uppercase tracking-wider mb-2">Beschreibung</h3>
              <p className="text-base text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap font-medium">
                {observation.description}
              </p>
            </div>

            {observation.photos && observation.photos.length > 0 && (
              <div className="p-6">
                <h3 className="text-xs font-bold text-black/40 uppercase tracking-wider mb-3">Fotos</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {observation.photos.map((photo: string, index: number) => (
                    <div key={index} className="aspect-square rounded-2xl overflow-hidden border border-black/5">
                      <img
                        src={photo}
                        alt={`Observation photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </IOSCard>
    </div>
  )
}
