<template>
  <div>
    <Heading size="xl" class="mb-6">Teacher Dashboard</Heading>
    
    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Meine Gruppen" :value="myGroupsCount" icon="👪" />
        <StatCard title="Zugewiesene Kinder" :value="childrenCount" icon="👶" />
        <StatCard title="Heutige Anwesenheit" :value="todayAttendance" icon="✅" />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="bg-white rounded-lg shadow p-6">
          <Heading size="md" class="mb-4">Meine Gruppen</Heading>
          <div v-if="myGroups.length === 0" class="text-gray-500 text-sm">
            No groups assigned yet
          </div>
          <div v-else class="space-y-2">
            <NuxtLink
              v-for="groupAssignment in myGroups"
              :key="groupAssignment.group.id"
              :to="`/teacher/groups/${groupAssignment.group.id}`"
              class="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium">{{ groupAssignment.group.name }}</p>
                  <p class="text-sm text-gray-600">{{ groupAssignment.group.age_range }}</p>
                </div>
                <div class="text-right">
                  <span
                    :class="[
                      'px-2 py-0.5 text-xs font-medium rounded-full',
                      groupAssignment.role === 'primary'
                        ? 'bg-blue-100 text-blue-800'
                        : groupAssignment.role === 'assistant'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    ]"
                  >
                    {{ groupAssignment.role === 'primary' ? 'Primary' : groupAssignment.role }}
                  </span>
                  <p class="text-xs text-gray-500 mt-1">{{ groupAssignment.childrenCount }} children</p>
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <Heading size="md" class="mb-4">Schnellzugriff</Heading>
          <div class="space-y-2">
            <NuxtLink
              to="/teacher/children"
              class="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              👶 Meine Kinder
            </NuxtLink>
            <NuxtLink
              to="/teacher/attendance"
              class="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              ✅ Anwesenheit erfassen
            </NuxtLink>
            <NuxtLink
              to="/teacher/daily-reports"
              class="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              📄 Tagesberichte
            </NuxtLink>
            <NuxtLink
              to="/teacher/observations"
              class="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              👁️ Beobachtungen
            </NuxtLink>
            <NuxtLink
              to="/teacher/portfolios"
              class="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              📔 Portfolios
            </NuxtLink>
            <NuxtLink
              to="/teacher/messages"
              class="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              💬 Nachrichten
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
import { useAuthStore } from '~/stores/auth'
import Heading from '~/components/ui/Heading.vue'
import StatCard from '~/components/common/StatCard.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'teacher'
})

const supabase = useSupabaseClient()
const authStore = useAuthStore()
const loading = ref(true)

const myGroups = ref<any[]>([])
const childrenCount = ref(0)
const todayAttendance = ref(0)

const myGroupsCount = computed(() => myGroups.value.length)

onMounted(async () => {
  try {
    const userId = authStore.user?.id
    if (!userId) return

    // Fetch my group assignments from group_teachers table
    const { data: assignments, error: assignError } = await supabase
      .from('group_teachers')
      .select('*, groups(*)')
      .eq('teacher_id', userId)
      .is('end_date', null)
      .order('start_date', { ascending: false })

    if (assignError) throw assignError

    // Get children count for each group
    const groupsWithCounts = await Promise.all(
      (assignments || []).map(async (assignment: any) => {
        const { count } = await supabase
          .from('children')
          .select('id', { count: 'exact', head: true })
          .eq('group_id', assignment.group_id)
          .eq('status', 'active')

        return {
          ...assignment,
          group: assignment.groups,
          childrenCount: count || 0
        }
      })
    )

    myGroups.value = groupsWithCounts

    // Total children count
    if (groupsWithCounts.length > 0) {
      const groupIds = groupsWithCounts.map((g: any) => g.group_id)
      const { count } = await supabase
        .from('children')
        .select('id', { count: 'exact', head: true })
        .in('group_id', groupIds)
        .eq('status', 'active')

      childrenCount.value = count || 0
    }

    // Today's attendance for my groups
    const today = new Date().toISOString().split('T')[0]
    if (groupsWithCounts.length > 0) {
      const groupIds = groupsWithCounts.map((g: any) => g.group_id)
      
      // Get children IDs first
      const { data: childrenData } = await supabase
        .from('children')
        .select('id')
        .in('group_id', groupIds)
        .eq('status', 'active')

      if (childrenData && childrenData.length > 0) {
        const childIds = childrenData.map(c => c.id)
        const { count } = await supabase
          .from('attendance')
          .select('id', { count: 'exact', head: true })
          .eq('date', today)
          .in('child_id', childIds)
          .eq('status', 'present')

        todayAttendance.value = count || 0
      }
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
  } finally {
    loading.value = false
  }
})
</script>
