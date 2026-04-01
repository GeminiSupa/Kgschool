'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useChildrenStore, type Child } from '@/stores/children'
import { useGroupsStore, type Group } from '@/stores/groups'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { GroupCapacityIndicator } from '@/components/groups/GroupCapacityIndicator'
import {
  suggestGroupsForChild,
  validateGroupAssignment,
  checkGroupCapacity,
} from '@/utils/groupAssignment'
import { useI18n } from '@/i18n/I18nProvider'
import { sT } from '@/i18n/sT'

type TeacherInGroup = {
  id?: string
  full_name?: string
  role?: string
}

type Capacity = { current: number; max: number; available: number }
type Suggestion = { group: Group; match: 'perfect' | 'good' | 'acceptable'; reason: string }

function toISODate(d: Date) {
  return d.toISOString().split('T')[0]
}

export default function AdminChildChangeGroupPage() {
  const { t } = useI18n()
  const router = useRouter()
  const params = useParams()
  const childId = typeof params?.id === 'string' ? params.id : ''

  const supabase = useMemo(() => createClient(), [])
  const childrenStore = useChildrenStore()
  const groupsStore = useGroupsStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [child, setChild] = useState<Child | null>(null)
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null)
  const [currentGroupTeachers, setCurrentGroupTeachers] = useState<TeacherInGroup[]>([])

  const [availableGroups, setAvailableGroups] = useState<Group[]>([])
  const [groupCapacities, setGroupCapacities] = useState<Record<string, Capacity>>({})

  const [newGroupId, setNewGroupId] = useState('')
  const [transferDate, setTransferDate] = useState(toISODate(new Date()))
  const [notes, setNotes] = useState('')

  const [selectedGroupCapacity, setSelectedGroupCapacity] = useState<
    (Capacity & { warning: string | null }) | null
  >(null)
  const [selectedGroupTeachers, setSelectedGroupTeachers] = useState<TeacherInGroup[]>([])

  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [validationWarnings, setValidationWarnings] = useState<string[]>([])

  const load = async () => {
    setLoading(true)
    setError('')

    try {
      if (!childId) {
        setError(t(sT('errNotFoundChild')))
        return
      }

      const childData = await childrenStore.fetchChildById(childId)
      if (!childData) {
        setError(t(sT('errNotFoundChild')))
        return
      }

      setChild(childData)

      if (childData.group_id) {
        const group = await groupsStore.fetchGroupById(childData.group_id)
        setCurrentGroup(group)
        const teachers = (await groupsStore.fetchGroupTeachers(childData.group_id)) as TeacherInGroup[]
        setCurrentGroupTeachers(teachers || [])
      } else {
        setCurrentGroup(null)
        setCurrentGroupTeachers([])
      }

      await groupsStore.fetchGroups()
      const groupsArray = groupsStore.groups || []

      const available = groupsArray.filter((g) => g.id !== childData.group_id)
      setAvailableGroups(available)

      const capacityMap: Record<string, Capacity> = {}
      for (const group of available) {
        // Sequential to keep it simple; can be parallelized later.
        const capacity = await groupsStore.getGroupCapacity(group.id)
        capacityMap[group.id] = capacity
      }
      setGroupCapacities(capacityMap)

      if (childData.date_of_birth) {
        const childrenCounts: Record<string, number> = {}
        for (const group of available) {
          childrenCounts[group.id] = capacityMap[group.id]?.current || 0
        }

        const computed = suggestGroupsForChild(
          { date_of_birth: childData.date_of_birth },
          available.map((g) => ({ id: g.id, name: g.name, age_range: g.age_range, capacity: g.capacity })),
          childrenCounts
        ) as Suggestion[]

        setSuggestions(computed)
      } else {
        setSuggestions([])
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t(sT('errLoadData')))
    } finally {
      setLoading(false)
    }
  }

  const onGroupChange = async (groupId: string) => {
    setValidationErrors([])
    setValidationWarnings([])

    if (!groupId) {
      setSelectedGroupCapacity(null)
      setSelectedGroupTeachers([])
      return
    }

    const selectedGroup = availableGroups.find((g) => g.id === groupId)
    if (!selectedGroup) return

    const capacity =
      groupCapacities[selectedGroup.id] || (await groupsStore.getGroupCapacity(selectedGroup.id))

    const capacityCheck = checkGroupCapacity(selectedGroup.id, capacity.current, capacity.max)
    setSelectedGroupCapacity({ ...capacity, warning: capacityCheck.warning })

    const teachers = (await groupsStore.fetchGroupTeachers(selectedGroup.id)) as TeacherInGroup[]
    setSelectedGroupTeachers(teachers || [])

    if (child && child.date_of_birth) {
      const validation = validateGroupAssignment(
        child,
        selectedGroup,
        capacity.current
      )

      setValidationErrors(validation.errors)
      setValidationWarnings(validation.warnings)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId, t])

  useEffect(() => {
    if (!newGroupId) return
    void onGroupChange(newGroupId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newGroupId])

  const handleSubmit = async () => {
    if (!newGroupId || !transferDate) {
      setValidationErrors([t(sT('errSelectGroupTransferDate'))])
      return
    }

    const selectedGroup = availableGroups.find((g) => g.id === newGroupId)
    if (!selectedGroup || !child) return

    const capacity = groupCapacities[selectedGroup.id] || (await groupsStore.getGroupCapacity(selectedGroup.id))
    const validation = validateGroupAssignment(child, selectedGroup, capacity.current)

    if (!validation.valid) {
      setValidationErrors(validation.errors)
      setValidationWarnings(validation.warnings)
      return
    }

    setValidationErrors([])
    setSubmitting(true)

    try {
      const { error: updateErr } = await supabase
        .from('children')
        .update({ group_id: newGroupId })
        .eq('id', childId)

      if (updateErr) throw updateErr

      alert(t(sT('successChildTransferred')))
      router.push(`/admin/children/${childId}`)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t(sT('errTransferChild'))
      setValidationErrors([message])
    } finally {
      setSubmitting(false)
    }
  }

  const [submitting, setSubmitting] = useState(false)

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
          onClick={() => router.push(`/admin/children/${childId}`)}
          className="text-gray-600 hover:text-gray-900 mb-4 inline-block"
        >
          ← Back to Child Details
        </button>
        <Heading size="xl">Change Child&#39;s Group</Heading>
      </div>

      {child ? (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <Heading size="md" className="mb-4">
              Current Assignment
            </Heading>

            {currentGroup ? (
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Group</p>
                  <p className="mt-1 text-gray-900 font-medium">
                    {currentGroup.name} ({currentGroup.age_range})
                  </p>
                </div>
                {currentGroupTeachers.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Current Teachers</p>
                    <div className="flex flex-wrap gap-2">
                      {currentGroupTeachers.map((teacher, idx) => (
                        <span key={teacher.id || String(idx)} className="px-2 py-1 text-xs bg-gray-100 rounded">
                          {teacher.full_name || 'Teacher'} ({teacher.role === 'primary' ? 'Primary' : teacher.role || 'Teacher'})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Child is not currently assigned to a group.</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <Heading size="md" className="mb-4">
              Select New Group
            </Heading>

            <div className="mb-4">
              <label htmlFor="new_group_id" className="block text-sm font-medium text-gray-700 mb-2">
                Group <span className="text-red-500">*</span>
              </label>

              <select
                id="new_group_id"
                value={newGroupId}
                onChange={(e) => setNewGroupId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a group</option>
                {availableGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.age_range})
                  </option>
                ))}
              </select>
            </div>

            {!newGroupId && suggestions.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm font-medium text-blue-900 mb-2">Suggested Groups:</p>
                <div className="space-y-1">
                  {suggestions.slice(0, 3).map((suggestion) => (
                    <button
                      key={suggestion.group.id}
                      type="button"
                      onClick={() => setNewGroupId(suggestion.group.id)}
                      className={[
                        'text-left w-full px-3 py-2 text-sm rounded-md border transition-colors',
                        suggestion.match === 'perfect'
                          ? 'bg-green-50 border-green-200 hover:bg-green-100'
                          : suggestion.match === 'good'
                            ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100',
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-medium">
                          {suggestion.group.name} ({suggestion.group.age_range})
                        </span>
                        <span className="text-xs text-gray-600">{suggestion.reason}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedGroupCapacity && (
              <div className="mb-4">
                <GroupCapacityIndicator current={selectedGroupCapacity.current} max={selectedGroupCapacity.max} />
                {selectedGroupCapacity.warning && (
                  <p className="text-xs text-orange-600 mt-1">{selectedGroupCapacity.warning}</p>
                )}
              </div>
            )}

            {selectedGroupTeachers.length > 0 && (
              <div className="mb-4 p-2 bg-gray-50 rounded-md">
                <p className="text-xs font-medium text-gray-700 mb-1">Teachers in New Group:</p>
                <div className="flex flex-wrap gap-1">
                  {selectedGroupTeachers.map((teacher, idx) => (
                    <span key={teacher.id || String(idx)} className="text-xs px-2 py-0.5 bg-white rounded border border-gray-200">
                      {teacher.full_name || 'Teacher'} (
                      {teacher.role === 'primary' ? 'Primary' : teacher.role || 'Teacher'})
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="transfer_date" className="block text-sm font-medium text-gray-700 mb-2">
                Transfer Date <span className="text-red-500">*</span>
              </label>

              <input
                id="transfer_date"
                type="date"
                value={transferDate}
                min={toISODate(new Date())}
                onChange={(e) => setTransferDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Reason for group change, special instructions, etc."
              />
            </div>

            {validationErrors.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {validationWarnings.length > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 text-yellow-700 rounded-md text-sm">
                <ul className="list-disc list-inside space-y-1">
                  {validationWarnings.map((warn) => (
                    <li key={warn}>{warn}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4 border-t">
              <button
                type="button"
                onClick={() => router.push(`/admin/children/${childId}`)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={submitting || !newGroupId || !transferDate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Transferring...' : 'Transfer to New Group'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

