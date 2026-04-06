'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useLunchStore, type LunchMenu } from '@/stores/lunch'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { useI18n } from '@/i18n/I18nProvider'
import { sT } from '@/i18n/sT'

type NutritionalForm = {
  calories: string
  protein: string
  carbs: string
  fat: string
}

export default function AdminLunchMenuEditPage() {
  const { t } = useI18n()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const menuId = params?.id

  const supabase = useMemo(() => createClient(), [])
  const lunchStore = useLunchStore()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [menu, setMenu] = useState<LunchMenu | null>(null)
  const [allergensInput, setAllergensInput] = useState('')

  const [form, setForm] = useState<{
    date: string
    meal_name: string
    description: string
    photo_url: string
  }>({
    date: new Date().toISOString().split('T')[0],
    meal_name: '',
    description: '',
    photo_url: '',
  })

  const [nutritionalInfo, setNutritionalInfo] = useState<NutritionalForm>({
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  })

  const handleDelete = async () => {
    if (!menuId) return
    if (!confirm(t(sT('confirmDeleteMenu')))) return
    setSubmitting(true)
    setError('')
    try {
      await lunchStore.deleteMenu(menuId)
      router.push('/admin/lunch/menus')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t(sT('errDeleteMenu')))
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    const run = async () => {
      if (!menuId) {
        setError(t(sT('errNotFoundMenu')))
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      try {
        const { data: menuData, error: menuError } = await supabase
          .from('lunch_menus')
          .select('*')
          .eq('id', menuId)
          .single()

        if (menuError) throw menuError
        if (!menuData) {
          setError(t(sT('errNotFoundMenu')))
          setMenu(null)
          return
        }

        const typed = menuData as LunchMenu
        setMenu(typed)
        setForm({
          date: typed.date,
          meal_name: typed.meal_name,
          description: typed.description || '',
          photo_url: typed.photo_url || '',
        })

        setAllergensInput((typed.allergens || []).join(', '))

        setNutritionalInfo({
          calories: typed.nutritional_info?.calories ?? '',
          protein: typed.nutritional_info?.protein ?? '',
          carbs: typed.nutritional_info?.carbs ?? '',
          fat: typed.nutritional_info?.fat ?? '',
        })
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t(sT('errLoadMenu')))
      } finally {
        setLoading(false)
      }
    }

    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuId, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!menuId) return

    setSubmitting(true)
    setError('')

    try {
      const allergens = allergensInput
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a.length > 0)

      const nutritional: Record<string, string> = {}
      if (nutritionalInfo.calories.trim()) nutritional.calories = nutritionalInfo.calories.trim()
      if (nutritionalInfo.protein.trim()) nutritional.protein = nutritionalInfo.protein.trim()
      if (nutritionalInfo.carbs.trim()) nutritional.carbs = nutritionalInfo.carbs.trim()
      if (nutritionalInfo.fat.trim()) nutritional.fat = nutritionalInfo.fat.trim()

      await lunchStore.updateMenu(menuId, {
        date: form.date,
        meal_name: form.meal_name,
        description: form.description || undefined,
        allergens,
        nutritional_info: Object.keys(nutritional).length > 0 ? nutritional : {},
        photo_url: form.photo_url || undefined,
      })

      router.push(`/admin/lunch/menus/${menuId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t(sT('errUpdateMenu')))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push(`/admin/lunch/menus/${menuId}`)}
          className="text-ui-muted hover:text-slate-900 dark:text-slate-50 mb-4 inline-block"
        >
          ← Back to Menu
        </button>
        <Heading size="xl" className="mb-1">
          Edit Lunch Menu
        </Heading>
        <p className="text-sm text-ui-soft">Update menu details, allergens, and nutritional information</p>
      </div>

      {loading && !menu ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : error && !menu ? (
        <div className="mb-6">
          <ErrorAlert message={error} />
        </div>
      ) : (
        <IOSCard className="max-w-2xl p-6 mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="date" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                id="date"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                type="date"
                required
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label htmlFor="meal_name" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                Meal Name <span className="text-red-500">*</span>
              </label>
              <input
                id="meal_name"
                value={form.meal_name}
                onChange={(e) => setForm((p) => ({ ...p, meal_name: e.target.value }))}
                type="text"
                required
                placeholder="e.g. Vegetable Pasta"
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                placeholder="Meal description..."
              />
            </div>

            <div>
              <label htmlFor="allergens" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                Allergens (comma-separated)
              </label>
              <input
                id="allergens"
                value={allergensInput}
                onChange={(e) => setAllergensInput(e.target.value)}
                type="text"
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="e.g. Nuts, Dairy, Gluten"
              />
              <p className="text-xs text-ui-soft mt-2">
                Enter allergens separated by commas. Common allergens: Gluten, Dairy, Nuts, Eggs, Fish, Soy
              </p>
              {allergensInput.trim().length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {allergensInput
                    .split(',')
                    .map((a) => a.trim())
                    .filter((a) => a.length > 0)
                    .slice(0, 20)
                    .map((a) => (
                      <span key={a} className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {a}
                      </span>
                    ))}
                </div>
              )}
            </div>

            <div className="p-5 bg-linear-to-br from-green-50 to-blue-50 rounded-xl border-2 border-green-100">
              <Heading size="md" className="mb-4">
                Nutritional Information (Optional)
              </Heading>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="calories" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Calories
                  </label>
                  <input
                    id="calories"
                    value={nutritionalInfo.calories}
                    onChange={(e) => setNutritionalInfo((p) => ({ ...p, calories: e.target.value }))}
                    type="number"
                    min={0}
                    className="w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g. 450"
                  />
                </div>
                <div>
                  <label htmlFor="protein" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Protein
                  </label>
                  <input
                    id="protein"
                    value={nutritionalInfo.protein}
                    onChange={(e) => setNutritionalInfo((p) => ({ ...p, protein: e.target.value }))}
                    type="text"
                    className="w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g. 20g"
                  />
                </div>
                <div>
                  <label htmlFor="carbs" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Carbohydrates
                  </label>
                  <input
                    id="carbs"
                    value={nutritionalInfo.carbs}
                    onChange={(e) => setNutritionalInfo((p) => ({ ...p, carbs: e.target.value }))}
                    type="text"
                    className="w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g. 50g"
                  />
                </div>
                <div>
                  <label htmlFor="fat" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Fat
                  </label>
                  <input
                    id="fat"
                    value={nutritionalInfo.fat}
                    onChange={(e) => setNutritionalInfo((p) => ({ ...p, fat: e.target.value }))}
                    type="text"
                    className="w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g. 15g"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="photo_url" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                Photo URL (Optional)
              </label>
              <input
                id="photo_url"
                value={form.photo_url}
                onChange={(e) => setForm((p) => ({ ...p, photo_url: e.target.value }))}
                type="url"
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="https://example.com/photo.jpg"
              />
              <p className="text-xs text-ui-soft mt-2">Enter a URL to an image of the meal</p>
              {form.photo_url && (
                <div className="mt-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.photo_url}
                    alt={form.meal_name}
                    className="w-full max-w-md h-48 object-cover rounded-lg border-2 border-gray-200"
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-200 text-red-800 rounded-xl text-sm">
                ⚠️ {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push(`/admin/lunch/menus/${menuId}`)}
                className="px-6 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                🗑️ Delete
              </button>
              <IOSButton type="submit" disabled={submitting} className="px-6 py-2.5">
                {submitting ? '⏳ Saving...' : '✅ Save Changes'}
              </IOSButton>
            </div>
          </form>
        </IOSCard>
      )}
    </div>
  )
}

