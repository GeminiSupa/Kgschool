<template>
  <div>
    <div class="mb-6">
      <Heading size="xl">Teacher Assignment Diagnostics</Heading>
      <p class="text-sm text-gray-600 mt-2">
        Use this page to check why teachers might not be appearing in the dropdown.
      </p>
    </div>

    <div class="space-y-6">
      <!-- Current User Info -->
      <IOSCard>
        <Heading size="md" class="mb-4">Current User Information</Heading>
        <div class="space-y-2">
          <div class="flex justify-between">
            <span class="font-medium">User ID:</span>
            <span class="text-gray-600">{{ userInfo.userId || 'Not found' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="font-medium">User Role:</span>
            <span class="text-gray-600">{{ userInfo.role || 'Not found' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="font-medium">User Kita ID:</span>
            <span class="text-gray-600">{{ userInfo.kitaId || 'Not found' }}</span>
          </div>
        </div>
      </IOSCard>

      <!-- Check 1: Teachers in Database -->
      <IOSCard>
        <Heading size="md" class="mb-4">Check 1: Teachers in Database</Heading>
        <div v-if="check1Loading" class="text-center py-4 text-gray-500">
          Loading...
        </div>
        <div v-else class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="font-medium">Total Teachers Found:</span>
            <span :class="[
              'px-3 py-1 rounded-full text-sm font-semibold',
              allTeachers.length > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            ]">
              {{ allTeachers.length }}
            </span>
          </div>
          <div v-if="allTeachers.length > 0" class="mt-4">
            <p class="text-sm font-medium mb-2">Teachers List:</p>
            <div class="space-y-2 max-h-60 overflow-y-auto">
              <div
                v-for="teacher in allTeachers"
                :key="teacher.id"
                class="p-2 bg-gray-50 rounded text-sm"
              >
                <p class="font-medium">{{ teacher.full_name }}</p>
                <p class="text-xs text-gray-600">Role: {{ teacher.role }} | ID: {{ teacher.id }}</p>
              </div>
            </div>
          </div>
          <div v-else class="text-red-600 text-sm">
            ⚠️ No teachers found in the database with role 'teacher' or 'support'.
            <br>
            <span class="text-xs">Action: Create teachers in the profiles table with role='teacher' or role='support'</span>
          </div>
        </div>
      </IOSCard>

      <!-- Check 2: Organization Members -->
      <IOSCard>
        <Heading size="md" class="mb-4">Check 2: Teachers in Organization Members</Heading>
        <div v-if="check2Loading" class="text-center py-4 text-gray-500">
          Loading...
        </div>
        <div v-else class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="font-medium">Your Kita ID:</span>
            <span class="text-gray-600">{{ userInfo.kitaId || 'Not set' }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="font-medium">Teachers in Organization:</span>
            <span :class="[
              'px-3 py-1 rounded-full text-sm font-semibold',
              orgTeachers.length > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            ]">
              {{ orgTeachers.length }}
            </span>
          </div>
          <div v-if="orgTeachers.length > 0" class="mt-4">
            <p class="text-sm font-medium mb-2">Teachers in Your Kita:</p>
            <div class="space-y-2 max-h-60 overflow-y-auto">
              <div
                v-for="teacher in orgTeachers"
                :key="teacher.id"
                class="p-2 bg-gray-50 rounded text-sm"
              >
                <p class="font-medium">{{ teacher.full_name }}</p>
                <p class="text-xs text-gray-600">Role: {{ teacher.role }} | Profile ID: {{ teacher.profile_id }}</p>
              </div>
            </div>
          </div>
          <div v-else-if="userInfo.kitaId" class="text-red-600 text-sm">
            ⚠️ No teachers found in organization_members for your Kita.
            <br>
            <span class="text-xs">Action: Add teachers to organization_members table with kita_id='{{ userInfo.kitaId }}'</span>
          </div>
          <div v-else class="text-yellow-600 text-sm">
            ⚠️ Your user doesn't have a kita_id assigned.
            <br>
            <span class="text-xs">Action: Add your profile_id to organization_members table with a kita_id</span>
          </div>
        </div>
      </IOSCard>

      <!-- Check 3: Groups with kita_id -->
      <IOSCard>
        <Heading size="md" class="mb-4">Check 3: Groups with kita_id</Heading>
        <div v-if="check3Loading" class="text-center py-4 text-gray-500">
          Loading...
        </div>
        <div v-else class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="font-medium">Groups with kita_id:</span>
            <span :class="[
              'px-3 py-1 rounded-full text-sm font-semibold',
              groupsWithKita.length > 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            ]">
              {{ groupsWithKita.length }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="font-medium">Groups without kita_id:</span>
            <span :class="[
              'px-3 py-1 rounded-full text-sm font-semibold',
              groupsWithoutKita.length > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
            ]">
              {{ groupsWithoutKita.length }}
            </span>
          </div>
          <div v-if="groupsWithoutKita.length > 0" class="mt-4">
            <p class="text-sm font-medium mb-2 text-yellow-800">Groups Missing kita_id:</p>
            <div class="space-y-2 max-h-60 overflow-y-auto">
              <div
                v-for="group in groupsWithoutKita"
                :key="group.id"
                class="p-2 bg-yellow-50 rounded text-sm"
              >
                <p class="font-medium">{{ group.name }}</p>
                <p class="text-xs text-gray-600">ID: {{ group.id }}</p>
              </div>
            </div>
            <p class="text-xs text-yellow-600 mt-2">
              Action: Update these groups to set their kita_id
            </p>
          </div>
        </div>
      </IOSCard>

      <!-- SQL Queries to Run -->
      <IOSCard>
        <Heading size="md" class="mb-4">SQL Queries to Check/Fix Issues</Heading>
        <div class="space-y-4">
          <div>
            <p class="font-medium mb-2">1. Check all teachers:</p>
            <pre class="bg-gray-100 p-3 rounded text-xs overflow-x-auto"><code>SELECT id, full_name, email, role 
FROM profiles 
WHERE role IN ('teacher', 'support')
ORDER BY full_name;</code></pre>
          </div>
          <div>
            <p class="font-medium mb-2">2. Check organization members:</p>
            <pre class="bg-gray-100 p-3 rounded text-xs overflow-x-auto"><code>SELECT om.*, p.full_name, p.role
FROM organization_members om
JOIN profiles p ON p.id = om.profile_id
WHERE om.kita_id IS NOT NULL
ORDER BY p.full_name;</code></pre>
          </div>
          <div>
            <p class="font-medium mb-2">3. Check groups with kita_id:</p>
            <pre class="bg-gray-100 p-3 rounded text-xs overflow-x-auto"><code>SELECT id, name, kita_id 
FROM groups 
ORDER BY name;</code></pre>
          </div>
          <div>
            <p class="font-medium mb-2">4. Add teacher to organization (replace values):</p>
            <pre class="bg-gray-100 p-3 rounded text-xs overflow-x-auto"><code>INSERT INTO organization_members (kita_id, profile_id, org_role)
VALUES (
  'YOUR_KITA_ID_HERE',
  'TEACHER_PROFILE_ID_HERE',
  'staff'
);</code></pre>
          </div>
          <div>
            <p class="font-medium mb-2">5. Update group with kita_id (replace values):</p>
            <pre class="bg-gray-100 p-3 rounded text-xs overflow-x-auto"><code>UPDATE groups 
SET kita_id = 'YOUR_KITA_ID_HERE'
WHERE id = 'GROUP_ID_HERE';</code></pre>
          </div>
        </div>
      </IOSCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
import { useAuthStore } from '~/stores/auth'
import { useKita } from '~/composables/useKita'
import Heading from '~/components/ui/Heading.vue'
import IOSCard from '~/components/ui/IOSCard.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const supabase = useSupabaseClient()
const authStore = useAuthStore()
const { getUserKitaId } = useKita()

const userInfo = ref({
  userId: '',
  role: '',
  kitaId: ''
})

const allTeachers = ref<any[]>([])
const orgTeachers = ref<any[]>([])
const groupsWithKita = ref<any[]>([])
const groupsWithoutKita = ref<any[]>([])

const check1Loading = ref(false)
const check2Loading = ref(false)
const check3Loading = ref(false)

onMounted(async () => {
  // Load user info
  userInfo.value = {
    userId: authStore.user?.id || '',
    role: authStore.profile?.role || '',
    kitaId: await getUserKitaId() || ''
  }

  // Run all checks
  await Promise.all([
    check1_AllTeachers(),
    check2_OrgMembers(),
    check3_Groups()
  ])
})

const check1_AllTeachers = async () => {
  check1Loading.value = true
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['teacher', 'support'])
      .order('full_name')

    if (error) throw error
    allTeachers.value = data || []
  } catch (e: any) {
    console.error('Error checking teachers:', e)
  } finally {
    check1Loading.value = false
  }
}

const check2_OrgMembers = async () => {
  check2Loading.value = true
  try {
    const kitaId = userInfo.value.kitaId
    if (!kitaId) {
      check2Loading.value = false
      return
    }

    // Get organization members
    const { data: members, error: membersError } = await supabase
      .from('organization_members')
      .select('profile_id')
      .eq('kita_id', kitaId)

    if (membersError) throw membersError

    const profileIds = members?.map(m => m.profile_id) || []

    if (profileIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', profileIds)
        .in('role', ['teacher', 'support'])
        .order('full_name')

      if (profilesError) throw profilesError

      // Add profile_id for display
      orgTeachers.value = (profiles || []).map(profile => ({
        ...profile,
        profile_id: profile.id
      }))
    } else {
      orgTeachers.value = []
    }
  } catch (e: any) {
    console.error('Error checking org members:', e)
  } finally {
    check2Loading.value = false
  }
}

const check3_Groups = async () => {
  check3Loading.value = true
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('id, name, kita_id')
      .order('name')

    if (error) throw error

    const groups = data || []
    groupsWithKita.value = groups.filter(g => g.kita_id)
    groupsWithoutKita.value = groups.filter(g => !g.kita_id)
  } catch (e: any) {
    console.error('Error checking groups:', e)
  } finally {
    check3Loading.value = false
  }
}
</script>
