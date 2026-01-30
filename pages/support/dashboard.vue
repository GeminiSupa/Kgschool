<template>
  <div>
    <Heading size="xl" class="mb-6">Support Staff Dashboard</Heading>
    
    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Total Children</p>
              <p class="text-2xl font-bold text-gray-900 mt-1">{{ totalChildren }}</p>
            </div>
            <span class="text-3xl">👶</span>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Today's Attendance</p>
              <p class="text-2xl font-bold text-gray-900 mt-1">{{ todayAttendance }}</p>
            </div>
            <span class="text-3xl">✅</span>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Unread Messages</p>
              <p class="text-2xl font-bold text-gray-900 mt-1">{{ unreadMessages }}</p>
            </div>
            <span class="text-3xl">💬</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-lg shadow p-6">
          <Heading size="md" class="mb-4">Quick Actions</Heading>
          <div class="space-y-2">
            <NuxtLink
              to="/support/attendance"
              class="block px-4 py-3 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
            >
              ✅ Take Attendance
            </NuxtLink>
            <NuxtLink
              to="/support/children"
              class="block px-4 py-3 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
            >
              👶 View Children
            </NuxtLink>
            <NuxtLink
              to="/support/messages"
              class="block px-4 py-3 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
            >
              💬 Send Messages
            </NuxtLink>
            <NuxtLink
              to="/support/reports"
              class="block px-4 py-3 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
            >
              📊 View Reports
            </NuxtLink>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <Heading size="md" class="mb-4">Recent Activity</Heading>
          <div v-if="recentActivity.length === 0" class="text-gray-500 text-sm">
            No recent activity.
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="activity in recentActivity"
              :key="activity.id"
              class="p-3 bg-gray-50 rounded-md text-sm"
            >
              <p class="font-medium">{{ activity.description }}</p>
              <p class="text-xs text-gray-500 mt-1">{{ formatTime(activity.timestamp) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'support'
})

const supabase = useSupabaseClient()
const loading = ref(true)
const totalChildren = ref(0)
const todayAttendance = ref(0)
const unreadMessages = ref(0)
const recentActivity = ref<any[]>([])

onMounted(async () => {
  try {
    await Promise.all([
      fetchChildrenCount(),
      fetchTodayAttendance(),
      fetchUnreadMessages(),
      fetchRecentActivity()
    ])
  } catch (error) {
    console.error('Error loading dashboard:', error)
  } finally {
    loading.value = false
  }
})

const fetchChildrenCount = async () => {
  const { count } = await supabase
    .from('children')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
  
  totalChildren.value = count || 0
}

const fetchTodayAttendance = async () => {
  const today = new Date().toISOString().split('T')[0]
  const { count } = await supabase
    .from('attendance')
    .select('id', { count: 'exact', head: true })
    .eq('date', today)
    .eq('status', 'present')
  
  todayAttendance.value = count || 0
}

const fetchUnreadMessages = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', user.id)
    .is('read_at', null)
  
  unreadMessages.value = count || 0
}

const fetchRecentActivity = async () => {
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('attendance_logs')
    .select('*, attendance:attendance_id (child_id)')
    .gte('timestamp', today)
    .order('timestamp', { ascending: false })
    .limit(5)

  if (data) {
    recentActivity.value = data.map(log => ({
      id: log.id,
      description: `Attendance ${log.action} recorded`,
      timestamp: log.timestamp
    }))
  }
}

const formatTime = (time: string) => {
  return new Date(time).toLocaleString()
}
</script>
