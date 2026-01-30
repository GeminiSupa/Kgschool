<template>
  <div>
    <div class="page-header-fiori mb-8">
      <h1 class="page-header-fiori-title">Dashboard</h1>
      <p class="page-header-fiori-subtitle">Overview of your kindergarten management system</p>
    </div>
    
    <div v-if="loading" class="flex justify-center py-16">
      <LoadingSpinner />
    </div>

    <div v-else class="space-y-8">
      <!-- Statistics Cards -->
      <div>
        <h2 class="text-lg font-semibold text-fiori-gray-900 mb-4">Overview</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Children" :value="totalChildren" icon="👶" />
          <StatCard title="Total Staff" :value="totalStaff" icon="👥" />
          <StatCard title="Today's Attendance" :value="todayAttendance" icon="✅" />
          <StatCard title="Active Groups" :value="activeGroups" icon="👪" />
        </div>
      </div>

      <div>
        <h2 class="text-lg font-semibold text-fiori-gray-900 mb-4">Kindergarten Features</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Users" :value="totalUsers" icon="👤" />
          <StatCard title="Daily Reports" :value="totalDailyReports" icon="📄" />
          <StatCard title="Learning Themes" :value="totalLearningThemes" icon="🎨" />
          <StatCard title="Observations" :value="totalObservations" icon="👁️" />
        </div>
      </div>

      <NuxtLink v-if="pendingLeaveRequests > 0" to="/admin/leave" class="block">
        <StatCard 
          title="Pending Leave Requests" 
          :value="pendingLeaveRequests" 
          icon="📝"
          subtitle="Requires your attention"
        />
      </NuxtLink>

      <!-- Quick Actions and Links -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Quick Actions" subtitle="Common tasks">
          <div class="space-y-2">
            <NuxtLink
              to="/admin/children/new"
              class="flex items-center gap-3 px-4 py-3 bg-fiori-blue-50 text-fiori-blue-600 rounded-md hover:bg-fiori-blue-100 transition-colors"
            >
              <span>➕</span>
              <span class="font-medium">Add New Child</span>
            </NuxtLink>
            <NuxtLink
              to="/admin/users/new"
              class="flex items-center gap-3 px-4 py-3 bg-fiori-blue-50 text-fiori-blue-600 rounded-md hover:bg-fiori-blue-100 transition-colors"
            >
              <span>➕</span>
              <span class="font-medium">Create User</span>
            </NuxtLink>
            <NuxtLink
              to="/admin/groups/new"
              class="flex items-center gap-3 px-4 py-3 bg-fiori-blue-50 text-fiori-blue-600 rounded-md hover:bg-fiori-blue-100 transition-colors"
            >
              <span>➕</span>
              <span class="font-medium">Create Group</span>
            </NuxtLink>
            <NuxtLink
              to="/admin/attendance"
              class="flex items-center gap-3 px-4 py-3 bg-fiori-blue-50 text-fiori-blue-600 rounded-md hover:bg-fiori-blue-100 transition-colors"
            >
              <span>📊</span>
              <span class="font-medium">View Attendance Reports</span>
            </NuxtLink>
            <NuxtLink
              v-if="pendingLeaveRequests > 0"
              to="/admin/leave"
              class="flex items-center gap-3 px-4 py-3 bg-yellow-50 text-yellow-700 rounded-md hover:bg-yellow-100 transition-colors"
            >
              <span>📝</span>
              <span class="font-medium">Review Leave Requests ({{ pendingLeaveRequests }})</span>
            </NuxtLink>
          </div>
        </Card>

        <Card title="Quick Links" subtitle="Navigate to main sections">
          <div class="grid grid-cols-1 gap-2">
            <NuxtLink
              v-for="link in quickLinks"
              :key="link.path"
              :to="link.path"
              class="flex items-center gap-3 px-4 py-2.5 text-fiori-gray-700 hover:bg-fiori-gray-50 rounded-md transition-colors"
            >
              <span class="text-lg">{{ link.icon }}</span>
              <span>{{ link.label }}</span>
            </NuxtLink>
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
import StatCard from '~/components/common/StatCard.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import Card from '~/components/ui/Card.vue'

const quickLinks = [
  { path: '/admin/children', label: 'Manage Children', icon: '👶' },
  { path: '/admin/staff', label: 'Manage Staff', icon: '👥' },
  { path: '/admin/users', label: 'Manage Users', icon: '👤' },
  { path: '/admin/groups', label: 'Manage Groups', icon: '👪' },
  { path: '/admin/daily-reports', label: 'Daily Reports', icon: '📄' },
  { path: '/admin/observations', label: 'Observations', icon: '👁️' },
  { path: '/admin/portfolios', label: 'Portfolios', icon: '📔' },
  { path: '/admin/learning-themes', label: 'Learning Themes', icon: '🎨' },
  { path: '/admin/daily-routines', label: 'Daily Routines', icon: '⏰' },
  { path: '/admin/lunch/menus', label: 'Lunch Menus', icon: '🍽️' },
  { path: '/admin/messages', label: 'Messages', icon: '💬' }
]

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const supabase = useSupabaseClient()
const loading = ref(true)

const totalChildren = ref(0)
const totalStaff = ref(0)
const todayAttendance = ref(0)
const activeGroups = ref(0)
const totalUsers = ref(0)
const pendingLeaveRequests = ref(0)
const totalDailyReports = ref(0)
const totalLearningThemes = ref(0)
const totalObservations = ref(0)

onMounted(async () => {
  try {
    // Fetch counts
    const [childrenRes, staffRes, attendanceRes, groupsRes, usersRes, leaveRequestsRes, dailyReportsRes, learningThemesRes, observationsRes] = await Promise.all([
      supabase.from('children').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).in('role', ['teacher', 'kitchen', 'support']),
      supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('date', new Date().toISOString().split('T')[0]),
      supabase.from('groups').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('daily_reports').select('id', { count: 'exact', head: true }).eq('report_date', new Date().toISOString().split('T')[0]),
      supabase.from('learning_themes').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('observations').select('id', { count: 'exact', head: true })
    ])

    totalChildren.value = childrenRes.count || 0
    totalStaff.value = staffRes.count || 0
    todayAttendance.value = attendanceRes.count || 0
    activeGroups.value = groupsRes.count || 0
    totalUsers.value = usersRes.count || 0
    pendingLeaveRequests.value = leaveRequestsRes.count || 0
    totalDailyReports.value = dailyReportsRes.count || 0
    totalLearningThemes.value = learningThemesRes.count || 0
    totalObservations.value = observationsRes.count || 0
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
  } finally {
    loading.value = false
  }
})
</script>
