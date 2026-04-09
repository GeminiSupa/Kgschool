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
import { IOSCard } from '@/components/ui/IOSCard'

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
          <p className="text-sm text-ui-muted mt-1">Dokumentieren Sie die Entwicklung der Kinder</p>
        </div>
        <Link href="/teacher/observations/new" className="inline-flex items-center gap-2">
          <IOSButton>
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
          className="min-h-11 px-4 py-2.5 border border-border rounded-2xl bg-background text-foreground text-sm font-semibold focus:ring-2 focus:ring-(--aura-primary)/25 outline-none"
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
          className="min-h-11 px-4 py-2.5 border border-border rounded-2xl bg-background text-foreground text-sm font-semibold focus:ring-2 focus:ring-(--aura-primary)/25 outline-none"
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
        <IOSCard className="p-0 overflow-hidden">
          {observations.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl opacity-20 mb-5">🔎</div>
              <p className="text-foreground font-black text-lg">Noch keine Beobachtungen</p>
              <p className="text-ui-soft mt-2 font-medium max-w-md mx-auto">
                Starten Sie mit der ersten Beobachtung, um Entwicklungsschritte und kleine Erfolge festzuhalten.
              </p>
              <div className="mt-6 flex justify-center">
                <Link href="/teacher/observations/new">
                  <IOSButton>➕ Erste Beobachtung hinzufügen</IOSButton>
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {observations.map((observation) => (
                <div key={observation.id} className="p-6 hover:bg-slate-50/60 dark:hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50">{getChildName(observation.child_id)}</h3>
                        {observation.development_area && (
                          <span className="px-2 py-1 bg-aura-accent/15 text-amber-700 dark:text-amber-300 text-xs rounded-xl font-bold">
                            {observation.development_area}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-ui-muted mb-2">{formatDate(observation.observation_date)}</p>
                      {observation.context && <p className="text-sm text-ui-soft mb-2 italic">{observation.context}</p>}
                      <p className="text-slate-700 dark:text-slate-200 mb-3">{observation.description}</p>
                      {observation.photos && observation.photos.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-ui-soft">📷 {observation.photos.length} Fotos</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/teacher/observations/${observation.id}`}
                        className="inline-flex min-h-11 items-center gap-1 px-4 py-2 rounded-2xl bg-aura-primary/10 text-aura-primary font-black text-xs uppercase tracking-widest hover:bg-aura-primary/15 transition-colors"
                      >
                        <span>👁️</span>
                        <span>Ansehen</span>
                      </Link>
                      <Link
                        href={`/teacher/observations/${observation.id}?edit=true`}
                        className="inline-flex min-h-11 items-center gap-1 px-4 py-2 rounded-2xl bg-aura-accent/15 text-amber-700 dark:text-amber-300 font-black text-xs uppercase tracking-widest hover:bg-aura-accent/20 transition-colors"
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
        </IOSCard>
      )}
    </div>
  )
}

