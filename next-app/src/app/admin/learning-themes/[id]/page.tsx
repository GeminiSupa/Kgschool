'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.learning-themes.id'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLearningThemesStore, type LearningTheme } from '@/stores/learningThemes'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'

type Params = { id?: string }

export default function AdminLearningThemeDetailPage() {
  const { t } = useI18n()

  const router = useRouter()
  const params = useParams() as Params
  const themeId = params.id || ''

  const learningThemesStore = useLearningThemesStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [theme, setTheme] = useState<LearningTheme | null>(null)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError('')

      try {
        await learningThemesStore.fetchLearningThemes()
        const found = learningThemesStore.learningThemes.find((t) => t.id === themeId) || null
        setTheme(found)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load learning theme')
      } finally {
        setLoading(false)
      }
    }

    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeId])

  return (
    <div>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push('/admin/learning-themes')}
          className="text-gray-600 hover:text-gray-900 mb-4 inline-block"
        >
          ← Back to Learning Themes
        </button>
        <Heading size="xl">{t(pT(ROUTE))}</Heading>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="mb-6">
          <ErrorAlert message={error} />
        </div>
      ) : !theme ? (
        <div className="p-8 text-center text-gray-500">Learning theme not found.</div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 max-w-3xl">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Title</h3>
              <p className="mt-1 text-lg text-gray-900">{theme.title}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <span
                className={[
                  'px-2 py-1 text-xs rounded',
                  theme.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : theme.status === 'completed'
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-blue-100 text-blue-700',
                ].join(' ')}
              >
                {theme.status}
              </span>
            </div>

            {theme.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1 text-gray-900 whitespace-pre-wrap">{theme.description}</p>
              </div>
            )}

            {theme.learning_areas && theme.learning_areas.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Learning Areas</h3>
                <div className="mt-1 flex flex-wrap gap-2">
                  {theme.learning_areas.map((area) => (
                    <span key={area} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {theme.activities && theme.activities.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Activities</h3>
                <ul className="mt-1 list-disc list-inside text-gray-900">
                  {theme.activities.map((activity) => (
                    <li key={activity}>{activity}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

