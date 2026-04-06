'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { CreateParentModal } from '@/components/modals/CreateParentModal'

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

  // Load selected parents initially
  useEffect(() => {
    async function loadSelected() {
      if (value && value.length > 0) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .in('id', value)
          .eq('role', 'parent')
        
        setSelectedParents(data || [])
      }
    }
    loadSelected()
  }, [supabase, value])

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setSearchQuery(q)

    if (!q.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
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
        <label className="block text-[14px] font-semibold text-[#1d1d1f] mb-2">
          Parents <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 px-4 py-2.5 bg-black/5 border border-black/10 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#667eea]/50 outline-none transition-all text-sm"
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={handleSearch}
          />
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors shadow-sm text-sm"
          >
            ➕ Create New
          </button>
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
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      isAdded
                        ? 'bg-gray-200 text-ui-soft cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
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
                className="flex items-center justify-between p-2.5 bg-blue-50/80 rounded-lg border border-blue-100"
              >
                <div>
                  <p className="text-sm font-semibold text-blue-900">{parent.full_name}</p>
                  <p className="text-xs text-blue-700">{parent.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeParent(parent.id)}
                  className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
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
