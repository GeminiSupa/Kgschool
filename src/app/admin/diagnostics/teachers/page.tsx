'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.diagnostics.teachers'

import React, { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { getProfileIdsForKita } from '@/utils/tenant/profileScope'
import { useAuth } from '@/hooks/useAuth'
import { useKita } from '@/hooks/useKita'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'

type TeacherProfile = {
  id: string
  full_name: string
  email?: string | null
  role?: string | null
}

type GroupLite = {
  id: string
  name: string
  kita_id?: string | null
}

export default function AdminDiagnosticsTeachersPage() {
  const { t } = useI18n()

  const supabase = useMemo(() => createClient(), [])
  const { profile } = useAuth()
  const { getUserKitaId } = useKita()

  const [userInfo, setUserInfo] = useState({
    userId: '',
    role: '',
    kitaId: '',
  })

  const [allTeachers, setAllTeachers] = useState<TeacherProfile[]>([])
  const [orgTeachers, setOrgTeachers] = useState<(TeacherProfile & { profile_id: string })[]>([])
  const [groupsWithKita, setGroupsWithKita] = useState<GroupLite[]>([])
  const [groupsWithoutKita, setGroupsWithoutKita] = useState<GroupLite[]>([])

  const [check1Loading, setCheck1Loading] = useState(false)
  const [check2Loading, setCheck2Loading] = useState(false)
  const [check3Loading, setCheck3Loading] = useState(false)

  useEffect(() => {
    const run = async () => {
      const kitaId = await getUserKitaId()

      setUserInfo({
        userId: profile?.id || '',
        role: profile?.role || '',
        kitaId: kitaId || '',
      })

      await Promise.all([check1_AllTeachers(), check2_OrgMembers(kitaId), check3_Groups()])
    }

    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const check1_AllTeachers = async () => {
    setCheck1Loading(true)
    try {
      const kitaId = await getUserKitaId()
      if (!kitaId) {
        setAllTeachers([])
        return
      }
      const tenantIds = await getProfileIdsForKita(supabase, kitaId)
      if (tenantIds.length === 0) {
        setAllTeachers([])
        return
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .in('id', tenantIds)
        .in('role', ['teacher', 'support'])
        .order('full_name')

      if (error) throw error
      setAllTeachers((data || []) as TeacherProfile[])
    } catch (e: unknown) {
      console.error('Error checking teachers:', e)
      setAllTeachers([])
    } finally {
      setCheck1Loading(false)
    }
  }

  const check2_OrgMembers = async (kitaId: string | null) => {
    setCheck2Loading(true)
    try {
      if (!kitaId) {
        setOrgTeachers([])
        return
      }

      const { data: members, error: membersError } = await supabase
        .from('organization_members')
        .select('profile_id')
        .eq('kita_id', kitaId)

      if (membersError) throw membersError

      const profileIds = (members || []).map((m: { profile_id: string }) => m.profile_id)
      if (profileIds.length === 0) {
        setOrgTeachers([])
        return
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .in('id', profileIds)
        .in('role', ['teacher', 'support'])
        .order('full_name')

      if (profilesError) throw profilesError

      const mapped = ((profiles || []) as TeacherProfile[]).map((p) => ({
        ...p,
        profile_id: p.id,
      }))
      setOrgTeachers(mapped)
    } catch (e: unknown) {
      console.error('Error checking org members:', e)
      setOrgTeachers([])
    } finally {
      setCheck2Loading(false)
    }
  }

  const check3_Groups = async () => {
    setCheck3Loading(true)
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('id, name, kita_id')
        .order('name')

      if (error) throw error
      const groups = (data || []) as GroupLite[]
      setGroupsWithKita(groups.filter((g) => !!g.kita_id))
      setGroupsWithoutKita(groups.filter((g) => !g.kita_id))
    } catch (e: unknown) {
      console.error('Error checking groups:', e)
      setGroupsWithKita([])
      setGroupsWithoutKita([])
    } finally {
      setCheck3Loading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Heading size="xl">{t(pT(ROUTE))}</Heading>
        <p className="text-sm text-ui-muted mt-2">
          Use this page to check why teachers might not be appearing in the dropdown.
        </p>
      </div>

      <IOSCard>
        <Heading size="md" className="mb-4">
          Current User Information
        </Heading>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">User ID:</span>
            <span className="text-ui-muted">{userInfo.userId || 'Not found'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">User Role:</span>
            <span className="text-ui-muted">{userInfo.role || 'Not found'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">User Kita ID:</span>
            <span className="text-ui-muted">{userInfo.kitaId || 'Not found'}</span>
          </div>
        </div>
      </IOSCard>

      <IOSCard>
        <Heading size="md" className="mb-4">
          Check 1: Teachers in Database
        </Heading>

        {check1Loading ? (
          <div className="text-center py-4 text-ui-soft">Loading...</div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Teachers Found:</span>
              <span
                className={[
                  'px-3 py-1 rounded-full text-sm font-semibold',
                  allTeachers.length > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
                ].join(' ')}
              >
                {allTeachers.length}
              </span>
            </div>

            {allTeachers.length > 0 ? (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Teachers List:</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {allTeachers.map((teacher) => (
                    <div key={teacher.id} className="p-2 bg-gray-50 rounded text-sm">
                      <p className="font-medium">{teacher.full_name}</p>
                      <p className="text-xs text-ui-muted">
                        Role: {teacher.role || 'N/A'} | ID: {teacher.id}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-red-600 text-sm">
                No teachers found in the database with role teacher or support.
              </div>
            )}
          </div>
        )}
      </IOSCard>

      <IOSCard>
        <Heading size="md" className="mb-4">
          Check 2: Teachers in Organization Members
        </Heading>
        {check2Loading ? (
          <div className="text-center py-4 text-ui-soft">Loading...</div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Your Kita ID:</span>
              <span className="text-ui-muted">{userInfo.kitaId || 'Not set'}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-medium">Teachers in Organization:</span>
              <span
                className={[
                  'px-3 py-1 rounded-full text-sm font-semibold',
                  orgTeachers.length > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
                ].join(' ')}
              >
                {orgTeachers.length}
              </span>
            </div>

            {orgTeachers.length > 0 ? (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Teachers in Your Kita:</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {orgTeachers.map((teacher) => (
                    <div key={teacher.id} className="p-2 bg-gray-50 rounded text-sm">
                      <p className="font-medium">{teacher.full_name}</p>
                      <p className="text-xs text-ui-muted">
                        Role: {teacher.role || 'N/A'} | Profile ID: {teacher.profile_id}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : userInfo.kitaId ? (
              <div className="text-red-600 text-sm">No teachers found in organization_members for your Kita.</div>
            ) : (
              <div className="text-yellow-600 text-sm">Your user does not have a Kita ID assigned.</div>
            )}
          </div>
        )}
      </IOSCard>

      <IOSCard>
        <Heading size="md" className="mb-4">
          Check 3: Groups with Kita ID
        </Heading>

        {check3Loading ? (
          <div className="text-center py-4 text-ui-soft">Loading...</div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Groups with Kita ID:</span>
              <span
                className={[
                  'px-3 py-1 rounded-full text-sm font-semibold',
                  groupsWithKita.length > 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800',
                ].join(' ')}
              >
                {groupsWithKita.length}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-medium">Groups without Kita ID:</span>
              <span
                className={[
                  'px-3 py-1 rounded-full text-sm font-semibold',
                  groupsWithoutKita.length > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800',
                ].join(' ')}
              >
                {groupsWithoutKita.length}
              </span>
            </div>

            {groupsWithoutKita.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2 text-yellow-800">Groups Missing Kita ID:</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {groupsWithoutKita.map((group) => (
                    <div key={group.id} className="p-2 bg-yellow-50 rounded text-sm">
                      <p className="font-medium">{group.name}</p>
                      <p className="text-xs text-ui-muted">ID: {group.id}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-yellow-600 mt-2">Update these groups to set their Kita ID.</p>
              </div>
            )}
          </div>
        )}
      </IOSCard>

      <IOSCard>
        <Heading size="md" className="mb-4">
          SQL Queries to Check/Fix Issues
        </Heading>

        <div className="space-y-4">
          <div>
            <p className="font-medium mb-2">1. Check all teachers:</p>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
              <code>
                SELECT id, full_name, email, role FROM profiles WHERE role IN (teacher, support) ORDER BY
                full_name;
              </code>
            </pre>
          </div>
          <div>
            <p className="font-medium mb-2">2. Check organization members:</p>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
              <code>
                SELECT om.*, p.full_name, p.role FROM organization_members om JOIN profiles p ON p.id = om.profile_id
                WHERE om.kita_id IS NOT NULL ORDER BY p.full_name;
              </code>
            </pre>
          </div>
          <div>
            <p className="font-medium mb-2">3. Check groups with Kita ID:</p>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
              <code>SELECT id, name, kita_id FROM groups ORDER BY name;</code>
            </pre>
          </div>
        </div>
      </IOSCard>
    </div>
  )
}

