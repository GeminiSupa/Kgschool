'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useChildrenStore, type Child } from '@/stores/children'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { CreateParentModal } from '@/components/modals/CreateParentModal'
import { useI18n } from '@/i18n/I18nProvider'
import { sT } from '@/i18n/sT'

type ProfileLite = {
  id: string
  full_name: string
  email: string
}

export default function AdminChildParentsPage() {
  const { t } = useI18n()
  const router = useRouter()
  const params = useParams()
  const childId = typeof params?.id === 'string' ? params.id : ''

  const supabase = useMemo(() => createClient(), [])
  const childrenStore = useChildrenStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [childName, setChildName] = useState('')
  const [currentParentIds, setCurrentParentIds] = useState<string[]>([])
  const [currentParents, setCurrentParents] = useState<ProfileLite[]>([])

  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<ProfileLite[]>([])

  const [showCreateModal, setShowCreateModal] = useState(false)

  const loadChild = async () => {
    setLoading(true)
    setError('')

    try {
      if (!childId) {
        setError(t(sT('errNotFoundChild')))
        return
      }

      const child = (await childrenStore.fetchChildById(childId)) as Child | null
      if (!child) {
        setError(t(sT('errNotFoundChild')))
        return
      }

      setChildName(`${child.first_name} ${child.last_name}`)

      const parentIds = child.parent_ids || []
      setCurrentParentIds(parentIds)

      if (parentIds.length > 0) {
        const { data, error: fetchErr } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', parentIds)
          .eq('role', 'parent')

        if (fetchErr) throw fetchErr
        setCurrentParents((data || []) as ProfileLite[])
      } else {
        setCurrentParents([])
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t(sT('errLoadChild')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadChild()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId, t])

  const searchParents = async () => {
    const q = searchQuery.trim()
    if (!q) {
      setSearchResults([])
      return
    }

    if (q.length < 2) {
      alert(t(sT('errSearchParentsMinChars')))
      return
    }

    setSearching(true)

    try {
      const { data, error: searchErr } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'parent')
        .or(`email.ilike.%${q}%,full_name.ilike.%${q}%`)
        .limit(10)

      if (searchErr) throw searchErr
      setSearchResults((data || []) as ProfileLite[])
    } catch (e: unknown) {
      console.error('Search error:', e)
      alert(t(sT('errSearchParents')))
    } finally {
      setSearching(false)
    }
  }

  const addParent = async (parentId: string) => {
    if (!parentId) {
      alert(t(sT('errInvalidParentId')))
      return
    }

    if (currentParentIds.includes(parentId)) {
      alert(t(sT('errParentAlreadyLinked')))
      return
    }

    try {
      const newParentIds = [...currentParentIds, parentId]

      const { error: updateErr } = await supabase.from('children').update({ parent_ids: newParentIds }).eq('id', childId)
      if (updateErr) throw updateErr

      setCurrentParentIds(newParentIds)

      const { data, error: fetchErr } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', parentId)
        .single()

      if (fetchErr) throw fetchErr
      if (data) setCurrentParents((prev) => [...prev, data as ProfileLite])

      setSearchQuery('')
      setSearchResults([])
    } catch (e: unknown) {
      console.error('Error adding parent:', e)
      alert(e instanceof Error ? e.message : t(sT('errAddParent')))
    }
  }

  const removeParent = async (parentId: string) => {
    if (!confirm(t(sT('confirmRemoveParentFromChild')))) return

    try {
      const newParentIds = currentParentIds.filter((id) => id !== parentId)
      const { error: updateErr } = await supabase.from('children').update({ parent_ids: newParentIds }).eq('id', childId)
      if (updateErr) throw updateErr

      setCurrentParentIds(newParentIds)
      setCurrentParents((prev) => prev.filter((p) => p.id !== parentId))
    } catch (e: unknown) {
      console.error('Error removing parent:', e)
      alert(e instanceof Error ? e.message : t(sT('errRemoveParent')))
    }
  }

  const handleParentCreated = async (newParent: { id?: string } | null) => {
    setShowCreateModal(false)
    if (newParent?.id) {
      await addParent(newParent.id)
      alert(t(sT('successParentLinked')))
    }
  }

  return (
    <div>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push(`/admin/children/${childId}`)}
          className="text-ui-muted hover:text-slate-900 dark:text-slate-50 mb-4 inline-block"
        >
          ← Back to Child
        </button>
        <Heading size="xl" className="mb-2">
          Manage Parents
        </Heading>
        {childName && <p className="text-slate-700 dark:text-slate-200 font-medium">Child: {childName}</p>}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="mb-6">
          <ErrorAlert message={error} />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <Heading size="md" className="mb-4">
              Manage Parents
            </Heading>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2 gap-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Search Parent by Email or Name
                </label>

                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  ➕ Create New Parent
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  type="text"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email or name..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void searchParents()
                  }}
                />

                <button
                  type="button"
                  onClick={() => void searchParents()}
                  disabled={searching}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Search Results:</p>
                <div className="space-y-2">
                  {searchResults.map((parent) => {
                    const alreadyAdded = currentParentIds.includes(parent.id)
                    return (
                      <div key={parent.id} className="p-3 bg-gray-50 rounded-md flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium">{parent.full_name}</p>
                          <p className="text-sm text-ui-muted">{parent.email}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void addParent(parent.id)}
                          disabled={alreadyAdded}
                          className={[
                            'px-3 py-1 text-sm rounded-md transition-colors',
                            alreadyAdded ? 'bg-gray-300 text-ui-soft cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700',
                          ].join(' ')}
                        >
                          {alreadyAdded ? 'Already Added' : 'Add'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {searchQuery && searchResults.length === 0 && !searching && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  No parents found matching {searchQuery}. Make sure the parent has an account with role parent.
                </p>
              </div>
            )}

            {searching && <div className="mb-6 text-center py-4 text-ui-soft text-sm">Searching...</div>}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <Heading size="md" className="mb-4">
              Current Parents
            </Heading>

            {currentParents.length === 0 ? (
              <div className="text-ui-soft text-sm">No parents linked to this child.</div>
            ) : (
              <div className="space-y-2">
                {currentParents.map((parent) => (
                  <div
                    key={parent.id}
                    className="p-3 bg-gray-50 rounded-md flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-medium">{parent.full_name}</p>
                      <p className="text-sm text-ui-muted">{parent.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void removeParent(parent.id)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreateParentModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(parent) => void handleParentCreated(parent as { id?: string } | null)}
        />
      )}
    </div>
  )
}

