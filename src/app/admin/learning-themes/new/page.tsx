'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.learning-themes.new'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLearningThemesStore, type LearningTheme } from '@/stores/learningThemes'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'

type Status = LearningTheme['status']

function splitLines(text: string): string[] {
  return text
    .split('\n')
    .map((a) => a.trim())
    .filter((a) => a.length > 0)
}

export default function AdminLearningThemesNewPage() {
  const { t } = useI18n()

  const router = useRouter()
  const learningThemesStore = useLearningThemesStore()

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [status, setStatus] = useState<Status>('active')

  const [learningAreasText, setLearningAreasText] = useState('')
  const [activitiesText, setActivitiesText] = useState('')

  const isFormValid = title.trim().length > 0 && !!status

  const handleSubmit = async () => {
    if (!isFormValid) return
    setSubmitting(true)
    setError('')

    try {
      const payload: Partial<LearningTheme> = {
        title: title.trim(),
        description: description.trim() ? description.trim() : undefined,
        start_date: startDate ? startDate : undefined,
        end_date: endDate ? endDate : undefined,
        status,
        learning_areas: splitLines(learningAreasText),
        activities: splitLines(activitiesText),
        photos: [],
      }

      await learningThemesStore.createLearningTheme(payload)
      alert('Learning theme created successfully!')
      router.push('/admin/learning-themes')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create learning theme')
    } finally {
      setSubmitting(false)
    }
  }

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

      <IOSCard className="max-w-3xl p-6">
        {error && <ErrorAlert message={error} />}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void handleSubmit()
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Nature Exploration"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the learning theme..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                id="start_date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                id="end_date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="planned">Planned</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label htmlFor="learning_areas" className="block text-sm font-medium text-gray-700 mb-2">
              Learning Areas (one per line)
            </label>
            <textarea
              id="learning_areas"
              value={learningAreasText}
              onChange={(e) => setLearningAreasText(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Social&#10;Motor&#10;Language"
            />
          </div>

          <div>
            <label htmlFor="activities" className="block text-sm font-medium text-gray-700 mb-2">
              Activities (one per line)
            </label>
            <textarea
              id="activities"
              value={activitiesText}
              onChange={(e) => setActivitiesText(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Activity 1&#10;Activity 2"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => router.push('/admin/learning-themes')}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <IOSButton
              type="submit"
              className="px-4 py-2"
              disabled={submitting || !isFormValid}
            >
              {submitting ? <LoadingSpinner size="sm" /> : 'Create Theme'}
            </IOSButton>
          </div>
        </form>
      </IOSCard>
    </div>
  )
}

