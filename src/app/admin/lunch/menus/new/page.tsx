'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'
import { sT, fillTemplate } from '@/i18n/sT'

const ROUTE = 'admin.lunch.menus.new'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLunchStore } from '@/stores/lunch'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { useKita } from '@/hooks/useKita'
import { ImageUpload } from '@/components/common/ImageUpload'
import { toUserErrorMessage } from '@/utils/errors/toUserErrorMessage'

export default function AdminLunchMenusNewPage() {
  const { t } = useI18n()

  const router = useRouter()
  const lunchStore = useLunchStore()
  const { getUserKitaId } = useKita()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [allergensInput, setAllergensInput] = useState('')

  const [form, setForm] = useState<{
    date: string
    meal_name: string
    description: string
    allergens: string[]
    photo_url: string
  }>(() => ({
    date: new Date().toISOString().split('T')[0],
    meal_name: '',
    description: '',
    allergens: [],
    photo_url: '',
  }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const allergens = allergensInput
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a.length > 0)

      // Keep kita_id consistent with the user's kita.
      const kitaIdResult = await getUserKitaId()
      console.log('Attempting to create menu with kitaId:', kitaIdResult)
      const kitaId = kitaIdResult || undefined

      await lunchStore.createMenu({
        date: form.date,
        meal_name: form.meal_name,
        description: form.description || undefined,
        allergens,
        nutritional_info: {},
        kita_id: kitaId,
        photo_url: form.photo_url || undefined,
      })

      router.push('/admin/lunch/menus')
    } catch (err: any) {
      console.error('Error creating menu:', err)
      setError(toUserErrorMessage(err, t(sT('errCreateMenu'))))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push('/admin/lunch/menus')}
          className="text-ui-muted hover:text-slate-900 dark:text-slate-50 mb-4 inline-block"
        >
          ← Back to Lunch Menus
        </button>
        <Heading size="xl">{t(pT(ROUTE))}</Heading>
      </div>

      <IOSCard className="max-w-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="date" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Datum <span className="text-red-500">*</span>
            </label>
            <input
              id="date"
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              type="date"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="meal_name" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Gerichtname <span className="text-red-500">*</span>
            </label>
            <input
              id="meal_name"
              value={form.meal_name}
              onChange={(e) => setForm((p) => ({ ...p, meal_name: e.target.value }))}
              type="text"
              required
              placeholder="z.B. Gemüse-Pasta"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Beschreibung
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              placeholder="Gerichtbeschreibung..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="allergens" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Allergene (kommagetrennt)
            </label>
            <input
              id="allergens"
              value={allergensInput}
              onChange={(e) => setAllergensInput(e.target.value)}
              type="text"
              placeholder="z.B. Nüsse, Milchprodukte"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="pt-4 border-t border-black/5">
            <ImageUpload 
                bucket="lunch-photos"
                label="Foto vom Gericht (optional)"
                onUploadSuccess={(url) => setForm(p => ({ ...p, photo_url: url }))}
                currentImageUrl={form.photo_url}
            />
          </div>
 
           {error && <ErrorAlert message={error} />}

          <div className="flex gap-3 justify-end pt-4">
            <IOSButton
              type="button"
              variant="secondary"
              onClick={() => router.push('/admin/lunch/menus')}
              disabled={loading}
            >
              Abbrechen
            </IOSButton>
            <IOSButton type="submit" disabled={loading} className="px-4 py-2">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <LoadingSpinner size="sm" /> Wird erstellt...
                </span>
              ) : (
                'Menü erstellen'
              )}
            </IOSButton>
          </div>
        </form>
      </IOSCard>
    </div>
  )
}

