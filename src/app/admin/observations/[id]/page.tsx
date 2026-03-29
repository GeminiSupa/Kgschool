'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.observations.id'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useObservationsStore, type Observation } from '@/stores/observations'
import { useChildrenStore, type Child } from '@/stores/children'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'

type Params = { id?: string }

function formatDate(date: string) {
  return new Date(date).toLocaleDateString()
}

export default function AdminObservationDetailPage() {
  const { t } = useI18n()

  const router = useRouter()
  const params = useParams() as Params
  const observationId = params.id || ''

  const observationsStore = useObservationsStore()
  const childrenStore = useChildrenStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [observation, setObservation] = useState<Observation | null>(null)

  const children: Child[] = childrenStore.children

  const getChildName = (childId: string) => {
    const child = children.find((c) => c.id === childId)
    return child ? `${child.first_name} ${child.last_name}` : childId
  }

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError('')

      try {
        await observationsStore.fetchObservations()
        const found = observationsStore.observations.find((o) => o.id === observationId) || null
        setObservation(found)

        await childrenStore.fetchChildren()
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load observation')
      } finally {
        setLoading(false)
      }
    }

    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [observationId])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mb-6">
        <ErrorAlert message={error} />
      </div>
    )
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

      {!observation ? (
        <div className="p-8 text-center text-gray-500">Observation not found.</div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 max-w-3xl">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Child</h3>
              <p className="mt-1 text-lg text-gray-900">{getChildName(observation.child_id)}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Date</h3>
              <p className="mt-1 text-gray-900">{formatDate(observation.observation_date)}</p>
            </div>

            {observation.context && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Context</h3>
                <p className="mt-1 text-gray-900">{observation.context}</p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="mt-1 text-gray-900 whitespace-pre-wrap">{observation.description}</p>
            </div>

            {observation.development_area && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Development Area</h3>
                <p className="mt-1 text-gray-900">{observation.development_area}</p>
              </div>
            )}

            {observation.photos && observation.photos.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Photos</h3>
                <div className="grid grid-cols-3 gap-2">
                  {observation.photos.map((photo) => (
                    <div key={photo}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo}
                        alt="Observation photo"
                        className="w-full h-32 object-cover rounded-md"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

