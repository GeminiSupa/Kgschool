'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { getActiveKitaId } from '@/utils/tenant/client'
import { getProfileIdsForKita } from '@/utils/tenant/profileScope'
import { CreateParentModal } from '@/components/modals/CreateParentModal'
import { IOSButton } from '@/components/ui/IOSButton'

interface ParentSelectorProps {
  value: string[]
  onChange: (ids: string[]) => void
}

export function ParentSelector({ value, onChange }: ParentSelectorProps) {
  const supabase = createClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedParents, setSelectedParents] = useState<any[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [tenantProfileIds, setTenantProfileIds] = useState<string[] | null>(null)

  useEffect(() => {
    const run = async () => {
      const kitaId = await getActiveKitaId()
      if (!kitaId) {
        setTenantProfileIds([])
        return
      }
      const ids = await getProfileIdsForKita(supabase, kitaId)
      setTenantProfileIds(ids)
    }
    void run()
  }, [supabase])

  // Load selected parents initially (only if linked to this Kita)
  useEffect(() => {
    async function loadSelected() {
      if (tenantProfileIds === null) return
      if (!value?.length) {
        setSelectedParents([])
        return
      }
      const allowed = value.filter((id) => tenantProfileIds.includes(id))
      if (allowed.length === 0) {
        setSelectedParents([])
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .in('id', allowed)
        .eq('role', 'parent')

      setSelectedParents(data || [])
    }
    void loadSelected()
  }, [supabase, value, tenantProfileIds])

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setSearchQuery(q)

    if (!q.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      if (!tenantProfileIds || tenantProfileIds.length === 0) {
        setSearchResults([])
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', tenantProfileIds)
        .eq('role', 'parent')
        .or(`email.ilike.%${q}%,full_name.ilike.%${q}%`)
        .limit(10)

      if (error) throw error
      setSearchResults(data || [])
    } catch (err: any) {
      console.error('Search error:', err)
    } finally {
      setSearching(false)
    }
  }

  const addParent = (parent: any) => {
    if (selectedParents.some((p) => p.id === parent.id)) return

    const newParents = [...selectedParents, parent]
    setSelectedParents(newParents)
    onChange(newParents.map((p) => p.id))
    
    setSearchQuery('')
    setSearchResults([])
  }

  const removeParent = (parentId: string) => {
    const newParents = selectedParents.filter((p) => p.id !== parentId)
    setSelectedParents(newParents)
    onChange(newParents.map((p) => p.id))
  }

  const handleParentCreated = (parent: any) => {
    addParent(parent)
    setShowCreateModal(false)
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-[14px] font-semibold text-slate-800 dark:text-slate-100 mb-2">
          Parents <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 px-4 py-2.5 rounded-2xl border border-border bg-card text-foreground outline-none transition-all text-sm"
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={handleSearch}
          />
          <IOSButton
            type="button"
            variant="primary"
            size="small"
            onClick={() => setShowCreateModal(true)}
            className="shrink-0"
          >
            ➕ Create New
          </IOSButton>
        </div>
      </div>

      {searchResults.length > 0 && (
        <div className="border border-black/10 rounded-xl p-3 max-h-48 overflow-y-auto bg-white/50 backdrop-blur">
          <p className="text-xs font-semibold text-ui-soft mb-2 uppercase tracking-wider">Search Results</p>
          <div className="space-y-1">
            {searchResults.map((parent) => {
              const isAdded = selectedParents.some((p) => p.id === parent.id)
              return (
                <div
                  key={parent.id}
                  className="flex items-center justify-between p-2 hover:bg-white rounded-lg transition-colors border border-transparent shadow-sm"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{parent.full_name}</p>
                    <p className="text-xs text-ui-soft">{parent.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addParent(parent)}
                    disabled={isAdded}
                    className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors ${
                      isAdded
                        ? 'bg-card text-ui-soft cursor-not-allowed border-border'
                        : 'bg-aura-primary/10 text-aura-primary border-aura-primary/30 hover:bg-aura-primary/15'
                    }`}
                  >
                    {isAdded ? 'Added' : 'Add'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {selectedParents.length > 0 && (
        <div className="border border-black/10 rounded-xl p-3 bg-white/50 backdrop-blur">
          <p className="text-xs font-semibold text-ui-soft mb-2 uppercase tracking-wider">Selected Parents</p>
          <div className="space-y-2">
            {selectedParents.map((parent) => (
              <div
                key={parent.id}
                className="flex items-center justify-between p-2.5 bg-aura-primary/10 rounded-lg border border-border"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{parent.full_name}</p>
                  <p className="text-xs text-ui-soft">{parent.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeParent(parent.id)}
                  className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-xl hover:bg-red-500 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {searchQuery && searchResults.length === 0 && !searching && (
        <p className="text-sm text-ui-soft font-medium">No parents found. Create a new parent account.</p>
      )}

      {showCreateModal && (
        <CreateParentModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleParentCreated}
        />
      )}
    </div>
  )
}
