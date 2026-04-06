'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { getActiveKitaId } from '@/utils/tenant/client'
import { getProfileIdsForKita } from '@/utils/tenant/profileScope'
import { IOSInput } from '@/components/ui/IOSInput'
import { IOSButton } from '@/components/ui/IOSButton'

interface GroupFormProps {
  group?: any
  onSubmit: (data: any) => void
  onCancel: () => void
  loading?: boolean
}

export function GroupForm({ group, onSubmit, onCancel, loading }: GroupFormProps) {
  const supabase = createClient()
  const isEdit = !!group
  const [error, setError] = useState('')
  const [teachers, setTeachers] = useState<any[]>([])

  const [form, setForm] = useState({
    name: group?.name || '',
    age_range: group?.age_range || '',
    capacity: group?.capacity || 20,
    educator_id: group?.educator_id || ''
  })

  useEffect(() => {
    const run = async () => {
      const kitaId = await getActiveKitaId()
      if (!kitaId) {
        setTeachers([])
        return
      }
      const tenantIds = await getProfileIdsForKita(supabase, kitaId)
      if (tenantIds.length === 0) {
        setTeachers([])
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .in('id', tenantIds)
        .eq('role', 'teacher')
        .order('full_name')
      setTeachers(data || [])
    }
    void run()
  }, [supabase])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <IOSInput
        id="name"
        label="Group Name *"
        type="text"
        required
        value={form.name}
        onChange={e => setForm({ ...form, name: e.target.value })}
        placeholder="e.g., Bears Group"
      />

      <div>
        <label className="block text-[14px] font-semibold text-[#1d1d1f] mb-2 tracking-[0.3px]">Age Range *</label>
        <select
          required
          value={form.age_range}
          onChange={e => setForm({ ...form, age_range: e.target.value })}
          className="w-full px-4 py-3 bg-white/90 border border-black/10 rounded-[12px] text-[#1d1d1f] outline-none focus:border-[#667eea]/50 focus:shadow-[0_0_0_4px_rgba(102,126,234,0.2)] transition-all"
        >
          <option value="">Select age range</option>
          <option value="U3">Under 3 (U3)</option>
          <option value="Ü3">Over 3 (Ü3)</option>
        </select>
      </div>

      <IOSInput
        id="capacity"
        label="Capacity *"
        type="number"
        required
        min={1}
        value={form.capacity}
        onChange={e => setForm({ ...form, capacity: Number(e.target.value) })}
      />

      <div>
        <label className="block text-[14px] font-semibold text-[#1d1d1f] mb-2 tracking-[0.3px]">Assigned Teacher</label>
        <select
          value={form.educator_id}
          onChange={e => setForm({ ...form, educator_id: e.target.value })}
          className="w-full px-4 py-3 bg-white/90 border border-black/10 rounded-[12px] text-[#1d1d1f] outline-none focus:border-[#667eea]/50 focus:shadow-[0_0_0_4px_rgba(102,126,234,0.2)] transition-all"
        >
          <option value="">No teacher assigned</option>
          {teachers.map(t => (
            <option key={t.id} value={t.id}>{t.full_name}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="p-3 bg-red-50/80 border border-red-100 rounded-xl text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-end pt-4 border-t border-black/5">
        <IOSButton type="button" variant="secondary" onClick={onCancel} className="px-6 py-2">
          Cancel
        </IOSButton>
        <IOSButton type="submit" variant="primary" disabled={loading} className="px-6 py-2">
          {loading ? 'Saving...' : (isEdit ? 'Update' : 'Create')}
        </IOSButton>
      </div>
    </form>
  )
}
