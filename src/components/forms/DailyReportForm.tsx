'use client'

import React, { useEffect, useState } from 'react'
import { useGroupsStore } from '@/stores/groups'
import { useAuth } from '@/hooks/useAuth'
import { IOSButton } from '@/components/ui/IOSButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

interface DailyReportFormProps {
  initialData?: any
  teacherGroupsOnly?: boolean
  onSubmit: (data: any) => void
  onCancel: () => void
  loading?: boolean
}

export const DailyReportForm = ({
  initialData,
  teacherGroupsOnly = false,
  onSubmit,
  onCancel,
  loading: submitting
}: DailyReportFormProps) => {
  const { user } = useAuth()
  const { groups: allGroups, loading: groupsLoading, error: groupsError, fetchGroups } = useGroupsStore()

  const [form, setForm] = useState({
    group_id: initialData?.group_id || '',
    report_date: initialData?.report_date || new Date().toISOString().split('T')[0],
    title: initialData?.title || '',
    content: initialData?.content || '',
    activities: initialData?.activities || [] as string[],
    weather: initialData?.weather || '',
    special_events: initialData?.special_events || '',
    photos: initialData?.photos || [] as string[]
  })

  const [activitiesText, setActivitiesText] = useState(initialData?.activities?.join('\n') || '')
  const [error, setError] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  const groups = teacherGroupsOnly 
    ? allGroups.filter(g => g.educator_id === user?.id)
    : allGroups

  const isFormValid = form.group_id && form.report_date && form.title && form.content.trim()

  const handleActivitiesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setActivitiesText(text)
    const activitiesList = text.split('\n').map(a => a.trim()).filter(a => a.length > 0)
    setForm(prev => ({ ...prev, activities: activitiesList }))
  }

  const handleGenerateAI = async () => {
    setIsGenerating(true)
    setError('')
    try {
      const res = await fetch('/api/ai/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activities: form.activities,
          weather: form.weather,
          specialEvents: form.special_events,
          briefNotes: form.content
        })
      })

      if (!res.ok) throw new Error('AI Bericht konnte nicht generiert werden.')

      const data = await res.json()
      if (data.error) throw new Error(data.error)
      
      setForm(prev => ({ ...prev, content: data.text }))
    } catch (e: any) {
      setError(e.message || 'Ein Fehler ist aufgetreten.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) {
      setError('Bitte füllen Sie alle erforderlichen Felder aus.')
      return
    }
    setError('')
    onSubmit(form)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setForm(prev => ({ ...prev, [id]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="group_id" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Gruppe <span className="text-red-500">*</span>
          </label>
          <select
            id="group_id"
            value={form.group_id}
            onChange={handleChange}
            required
            disabled={groupsLoading}
            className="ui-select disabled:opacity-50"
          >
            <option value="">{groupsLoading ? 'Lade Gruppen...' : 'Gruppe auswählen'}</option>
            {groups.map((group: any) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          {groupsError && (
            <p className="mt-1 text-xs text-red-500">Fehler: {groupsError.message}</p>
          )}
          {!groupsLoading && groups.length === 0 && teacherGroupsOnly && (
            <p className="mt-1 text-xs text-amber-600 font-medium">⚠️ Keine Gruppen zugewiesen.</p>
          )}
        </div>

        <div>
          <label htmlFor="report_date" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Datum <span className="text-red-500">*</span>
          </label>
          <input
            id="report_date"
            type="date"
            value={form.report_date.split('T')[0]}
            onChange={handleChange}
            required
            className="ui-input"
          />
        </div>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
          Titel <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={form.title}
          onChange={handleChange}
          required
          className="ui-input"
          placeholder="z.B. Ein wunderbarer Tag in Gruppe A"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label htmlFor="content" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Inhalt <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={handleGenerateAI}
            disabled={isGenerating}
            className="text-sm font-semibold text-aura-primary hover:opacity-90 flex items-center gap-1.5 disabled:opacity-50 transition-colors bg-aura-primary/10 px-3 py-1.5 rounded-xl"
          >
            {isGenerating ? <LoadingSpinner size="sm" /> : '✨ Magic Wand'}
          </button>
        </div>
        <textarea
          id="content"
          value={form.content}
          onChange={handleChange}
          rows={6}
          required
          className="ui-textarea"
          placeholder="Stichpunkte oder Text hier eingeben... (dann 'Magic Wand' drücken)"
        />
      </div>

      <div>
        <label htmlFor="activities" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
          Aktivitäten (eine pro Zeile)
        </label>
        <textarea
          id="activities"
          value={activitiesText}
          onChange={handleActivitiesChange}
          rows={4}
          className="ui-textarea"
          placeholder="Morgenkreis&#10;Freispiel&#10;Draußenzeit"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="weather" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Wetter
          </label>
          <input
            id="weather"
            type="text"
            value={form.weather}
            onChange={handleChange}
            className="ui-input"
            placeholder="z.B. Sonnig, 20°C"
          />
        </div>

        <div>
          <label htmlFor="special_events" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Besondere Ereignisse
          </label>
          <input
            id="special_events"
            type="text"
            value={form.special_events}
            onChange={handleChange}
            className="ui-input"
            placeholder="z.B. Geburtstagsfeier"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium border border-red-100">
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-end pt-4">
        <IOSButton
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="px-6 py-2.5 font-bold"
        >
          Abbrechen
        </IOSButton>
        <IOSButton
          type="submit"
          variant="primary"
          disabled={submitting || !isFormValid}
          className="px-6 py-2.5 font-bold min-w-[140px]"
        >
          {submitting ? <LoadingSpinner size="sm" /> : initialData ? 'Speichern' : 'Erstellen'}
        </IOSButton>
      </div>
    </form>
  )
}
