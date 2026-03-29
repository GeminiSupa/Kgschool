'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { IOSInput } from '@/components/ui/IOSInput'
import { IOSButton } from '@/components/ui/IOSButton'
import { ParentSelector } from '@/components/forms/ParentSelector'
import { GroupCapacityIndicator } from '@/components/groups/GroupCapacityIndicator'
import { suggestGroupsForChild, checkGroupCapacity } from '@/utils/groupAssignment'
import { useGroupsStore } from '@/stores/groups'

interface ChildFormProps {
  child?: any
  groups?: any[]
  onSubmit: (data: any) => void
  onCancel: () => void
  loading?: boolean
}

export function ChildForm({ child, groups: initialGroups, onSubmit, onCancel, loading }: ChildFormProps) {
  const groupsStore = useGroupsStore()

  const isEdit = !!child
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    first_name: child?.first_name || '',
    last_name: child?.last_name || '',
    date_of_birth: child?.date_of_birth || '',
    enrollment_date: child?.enrollment_date || new Date().toISOString().split('T')[0],
    group_id: child?.group_id || '',
    status: child?.status || 'active',
    parent_ids: child?.parent_ids || []
  })

  const [groups, setGroups] = useState<any[]>(initialGroups || [])
  const [groupCapacities, setGroupCapacities] = useState<Record<string, any>>({})
  const [selectedGroupTeachers, setSelectedGroupTeachers] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [selectedGroupCapacity, setSelectedGroupCapacity] = useState<any>(null)

  // Load groups if not provided
  useEffect(() => {
    if (!initialGroups || initialGroups.length === 0) {
      groupsStore.fetchGroups().then(() => {
        setGroups(groupsStore.groups)
      })
    }
  }, [initialGroups])

  // Preload group data/capacities once we have groups
  useEffect(() => {
    async function loadGroupData() {
      const newCaps: Record<string, any> = {}
      for (const group of groups) {
        const capacity = await groupsStore.getGroupCapacity(group.id)
        newCaps[group.id] = capacity
      }
      setGroupCapacities(newCaps)
    }
    if (groups.length > 0) {
      loadGroupData()
    }
  }, [groups])

  // Update suggestions when DOB changes
  useEffect(() => {
    if (!form.date_of_birth) {
      setSuggestions([])
      return
    }

    const currentChildrenCount: Record<string, number> = {}
    for (const group of groups) {
      const cap = groupCapacities[group.id] || { current: 0 }
      currentChildrenCount[group.id] = cap.current
    }

    const sugs = suggestGroupsForChild(
      { date_of_birth: form.date_of_birth },
      groups,
      currentChildrenCount
    )
    setSuggestions(sugs)
  }, [form.date_of_birth, groups, groupCapacities])

  // Load selected group's detailed data
  useEffect(() => {
    async function fetchSelectedGroupData() {
      if (form.group_id) {
        const capacity = await groupsStore.getGroupCapacity(form.group_id)
        const check = checkGroupCapacity(form.group_id, capacity.current, capacity.max)
        setSelectedGroupCapacity({ ...capacity, warning: check.warning })

        const teachers = await groupsStore.fetchGroupTeachers(form.group_id)
        setSelectedGroupTeachers(teachers || [])
      } else {
        setSelectedGroupCapacity(null)
        setSelectedGroupTeachers([])
      }
    }
    fetchSelectedGroupData()
  }, [form.group_id])

  const sortedGroups = useMemo(() => {
    return groups.map((g) => {
      const cap = groupCapacities[g.id] || { current: 0, max: g.capacity, available: g.capacity }
      const capacityInfo = cap.available > 0
        ? `${cap.current}/${cap.max} (${cap.available} available)`
        : `${cap.current}/${cap.max} (Full)`
      return { ...g, capacityInfo }
    })
  }, [groups, groupCapacities])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (form.parent_ids.length === 0) {
      setError('Please select at least one parent')
      return
    }

    if (form.group_id && form.date_of_birth) {
      const capacity = groupCapacities[form.group_id]
      if (capacity) {
        const validation = checkGroupCapacity(form.group_id, capacity.current, capacity.max)
        if (!validation.available) {
           setError('Selected group is at full capacity. Please choose another group.')
           return
        }
      }
    }

    setError('')
    const submitData = {
      ...form,
      group_id: form.group_id || null
    }
    onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <IOSInput
          id="first_name"
          label="Vorname"
          type="text"
          required
          value={form.first_name}
          onChange={(e) => setForm({ ...form, first_name: e.target.value })}
        />
        <IOSInput
          id="last_name"
          label="Nachname"
          type="text"
          required
          value={form.last_name}
          onChange={(e) => setForm({ ...form, last_name: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <IOSInput
          id="date_of_birth"
          label="Geburtsdatum"
          type="date"
          required
          value={form.date_of_birth}
          onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
        />
        <IOSInput
          id="enrollment_date"
          label="Einschulungsdatum"
          type="date"
          required
          value={form.enrollment_date}
          onChange={(e) => setForm({ ...form, enrollment_date: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-[14px] font-semibold text-[#1d1d1f] mb-2 tracking-[0.3px]">Gruppe</label>
        <select
          value={form.group_id}
          onChange={(e) => setForm({ ...form, group_id: e.target.value })}
          className="w-full px-4 py-3 bg-white/90 backdrop-blur-[10px] border border-black/10 rounded-[12px] text-[#1d1d1f] text-base transition-all outline-none focus:border-[#667eea]/50 focus:shadow-[0_0_0_4px_rgba(102,126,234,0.2)]"
        >
          <option value="">Ungrouped (Unassigned)</option>
          {sortedGroups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name} ({group.age_range}) - {group.capacityInfo}
            </option>
          ))}
        </select>

        {!form.group_id && suggestions.length > 0 && (
          <div className="mt-3 p-4 bg-blue-50/50 border border-blue-100/50 rounded-xl">
            <p className="text-sm font-semibold text-blue-900 mb-2">Vorgeschlagene Gruppen:</p>
            <div className="space-y-2">
              {suggestions.slice(0, 3).map((suggestion) => (
                <button
                  key={suggestion.group.id}
                  type="button"
                  onClick={() => setForm({ ...form, group_id: suggestion.group.id })}
                  className={`w-full text-left px-4 py-3 text-sm rounded-xl border transition-all ${
                    suggestion.match === 'perfect' ? 'bg-green-50/80 border-green-200 hover:bg-green-100' :
                    suggestion.match === 'good' ? 'bg-blue-50/80 border-blue-200 hover:bg-blue-100' :
                    'bg-gray-50/80 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{suggestion.group.name} ({suggestion.group.age_range})</span>
                    <span className="text-xs text-black/50 font-medium">{suggestion.reason}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {form.group_id && selectedGroupCapacity && (
          <div className="mt-4 p-4 bg-white/50 border border-black/5 rounded-xl">
            <GroupCapacityIndicator current={selectedGroupCapacity.current} max={selectedGroupCapacity.max} />
            {selectedGroupCapacity.warning && (
              <p className="text-xs font-semibold text-orange-600 mt-2">{selectedGroupCapacity.warning}</p>
            )}
          </div>
        )}

        {form.group_id && selectedGroupTeachers.length > 0 && (
          <div className="mt-2 p-3 bg-black/5 rounded-xl">
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Zugewiesene Lehrer:</p>
            <div className="flex flex-wrap gap-2">
              {selectedGroupTeachers.map((teacher) => (
                <span key={teacher.id} className="px-2 py-1 bg-white/80 rounded-lg text-xs font-medium text-gray-700 shadow-sm">
                  {teacher.full_name} <span className="text-gray-400">({teacher.role === 'primary' ? 'Primary' : teacher.role})</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-[14px] font-semibold text-[#1d1d1f] mb-2 tracking-[0.3px]">Status</label>
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as any })}
          className="w-full px-4 py-3 bg-white/90 backdrop-blur-[10px] border border-black/10 rounded-[12px] text-[#1d1d1f] text-base transition-all outline-none focus:border-[#667eea]/50 focus:shadow-[0_0_0_4px_rgba(102,126,234,0.2)]"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <div className="pt-2">
        <ParentSelector
          value={form.parent_ids}
          onChange={(ids) => setForm({ ...form, parent_ids: ids })}
        />
        {form.parent_ids.length === 0 && (
          <p className="text-xs font-medium text-red-500 mt-2">At least one parent must be selected</p>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50/80 border border-red-100 rounded-xl text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-end pt-6 border-t border-black/5">
        <IOSButton type="button" variant="secondary" onClick={onCancel} className="px-6 py-2">
          Abbrechen
        </IOSButton>
        <IOSButton type="submit" variant="primary" disabled={loading} className="px-6 py-2 w-full md:w-auto">
          {loading ? 'Wird gespeichert...' : (isEdit ? 'Aktualisieren' : 'Erstellen')}
        </IOSButton>
      </div>
    </form>
  )
}
