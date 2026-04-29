'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useKita } from '@/hooks/useKita'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'

type ParentWorkTaskLite = {
  id: string
  title: string
  created_by: string
  created_at: string
  kita_id: string | null
}

export default function AdminDiagnosticsParentWorkPage() {
  const supabase = useMemo(() => createClient(), [])
  const { profile } = useAuth()
  const { getUserKitaId } = useKita()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userKitaId, setUserKitaId] = useState('')
  const [totalTasks, setTotalTasks] = useState(0)
  const [missingKitaTasks, setMissingKitaTasks] = useState<ParentWorkTaskLite[]>([])

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError('')
      try {
        const kitaId = await getUserKitaId()
        setUserKitaId(kitaId || '')

        const { count: totalCount, error: totalError } = await supabase
          .from('parent_work_tasks')
          .select('id', { count: 'exact', head: true })
        if (totalError) throw totalError
        setTotalTasks(totalCount || 0)

        const { data: missingRows, error: missingError } = await supabase
          .from('parent_work_tasks')
          .select('id, title, created_by, created_at, kita_id')
          .is('kita_id', null)
          .order('created_at', { ascending: false })
          .limit(50)
        if (missingError) throw missingError
        setMissingKitaTasks((missingRows || []) as ParentWorkTaskLite[])
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to run parent work diagnostics.')
      } finally {
        setLoading(false)
      }
    }

    void run()
  }, [getUserKitaId, supabase])

  return (
    <div className="space-y-6">
      <div>
        <Heading size="xl">Parent Work Diagnostics</Heading>
        <p className="mt-2 text-sm text-ui-muted">
          Verify whether any parent work tasks are still missing <code>kita_id</code> after the backfill migration.
        </p>
      </div>

      <IOSCard>
        <Heading size="md" className="mb-4">
          Current Context
        </Heading>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="font-medium">User ID</span>
            <span className="text-ui-muted break-all">{profile?.id || 'Not found'}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="font-medium">Role</span>
            <span className="text-ui-muted">{profile?.role || 'Not found'}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="font-medium">Active Kita ID</span>
            <span className="text-ui-muted break-all">{userKitaId || 'Not found'}</span>
          </div>
        </div>
      </IOSCard>

      <IOSCard>
        <Heading size="md" className="mb-4">
          Parent Work Task Health
        </Heading>
        {loading ? (
          <p className="text-sm text-ui-muted">Loading diagnostics...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total parent_work_tasks</span>
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-700">
                {totalTasks}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Rows with NULL kita_id</span>
              <span
                className={[
                  'px-3 py-1 rounded-full text-sm font-semibold',
                  missingKitaTasks.length === 0 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700',
                ].join(' ')}
              >
                {missingKitaTasks.length}
              </span>
            </div>

            {missingKitaTasks.length > 0 ? (
              <div className="pt-2">
                <p className="text-sm font-medium mb-2">Latest rows still missing kita_id:</p>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {missingKitaTasks.map((row) => (
                    <div key={row.id} className="rounded-lg border border-amber-100 bg-amber-50/60 p-3 text-xs">
                      <p className="font-semibold text-slate-800">{row.title || '(untitled task)'}</p>
                      <p className="text-ui-muted break-all">task_id: {row.id}</p>
                      <p className="text-ui-muted break-all">created_by: {row.created_by}</p>
                      <p className="text-ui-muted">created_at: {new Date(row.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-green-700">All parent work tasks have a kita_id. Backfill looks good.</p>
            )}
          </div>
        )}
      </IOSCard>
    </div>
  )
}

