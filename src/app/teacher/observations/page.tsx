'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'teacher.observations'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useObservationsStore, type Observation } from '@/stores/observations'
import { useChildrenStore, type Child } from '@/stores/children'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSButton } from '@/components/ui/IOSButton'

export default function TeacherObservationsPage() {
  const { t } = useI18n()

  const observationsStore = useObservationsStore()
  const { observations, loading, error, fetchObservations } = observationsStore

  const childrenStore = useChildrenStore()
  const { children, fetchChildren } = childrenStore

  const [selectedChildId, setSelectedChildId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')

  useEffect(() => {
    void Promise.all([fetchChildren(), fetchObservations(undefined, undefined)])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const myChildren = useMemo(() => children, [children])

  const getChildName = (childId: string) => {
    const child = myChildren.find((c: Child) => c.id === childId)
    return child ? `${child.first_name} ${child.last_name}` : childId
  }

  const formatDate = (date: string) => new Date(date).toLocaleDateString('de-DE')

  const handleFiltersChange = async () => {
    await fetchObservations(
      selectedChildId || undefined,
      selectedDate || undefined
    )
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6 gap-4">
        <div>
          <Heading size="xl">{t(pT(ROUTE))}</Heading>
          <p className="text-sm text-gray-600 mt-1">Dokumentieren Sie die Entwicklung der Kinder</p>
        </div>
        <Link href="/teacher/observations/new" className="inline-flex items-center gap-2">
          <IOSButton className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm">
            ➕ Neue Beobachtung
          </IOSButton>
        </Link>
      </div>

      <div className="mb-4 flex flex-col md:flex-row gap-4">
        <select
          value={selectedChildId}
          onChange={(e) => {
            setSelectedChildId(e.target.value)
            void handleFiltersChange()
          }}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Alle Kinder</option>
          {myChildren.map((child) => (
            <option key={child.id} value={child.id}>
              {child.first_name} {child.last_name}
            </option>
          ))}
        </select>
        <input
          value={selectedDate}
          type="date"
          onChange={(e) => {
            setSelectedDate(e.target.value)
            void handleFiltersChange()
          }}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="mb-6">
          <ErrorAlert message={error.message || 'Fehler beim Laden der Beobachtungen'} />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {observations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Keine Beobachtungen gefunden.</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {observations.map((observation) => (
                <div key={observation.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{getChildName(observation.child_id)}</h3>
                        {observation.development_area && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            {observation.development_area}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{formatDate(observation.observation_date)}</p>
                      {observation.context && <p className="text-sm text-gray-500 mb-2 italic">{observation.context}</p>}
                      <p className="text-gray-700 mb-3">{observation.description}</p>
                      {observation.photos && observation.photos.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">📷 {observation.photos.length} Fotos</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/teacher/observations/${observation.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                      >
                        <span>👁️</span>
                        <span>Ansehen</span>
                      </Link>
                      <Link
                        href={`/teacher/observations/${observation.id}?edit=true`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-md hover:bg-yellow-100 transition-colors"
                      >
                        <span>✏️</span>
                        <span>Bearbeiten</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

