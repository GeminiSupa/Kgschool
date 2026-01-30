<template>
  <div>
    <div class="ios-page-header">
      <h1>Dashboard</h1>
      <p>Übersicht über Ihr Kindergarten-Managementsystem</p>
    </div>
    
    <div v-if="loading" class="flex justify-center py-16">
      <LoadingSpinner />
    </div>

    <div v-else class="space-y-8">
      <!-- Statistics Cards -->
      <div>
        <h2 class="text-xl font-bold text-gray-900 mb-4">Übersicht</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <IOSStatCard title="Gesamt Kinder" :value="totalChildren" icon="👶" to="/admin/children" />
          <IOSStatCard title="Gesamt Personal" :value="totalStaff" icon="👥" to="/admin/staff" />
          <IOSStatCard title="Heutige Anwesenheit" :value="todayAttendance" icon="✅" to="/admin/attendance" />
          <IOSStatCard title="Aktive Gruppen" :value="activeGroups" icon="👪" to="/admin/groups" />
        </div>
      </div>

      <div>
        <h2 class="text-xl font-bold text-gray-900 mb-4">Kindergarten-Funktionen</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <IOSStatCard title="Benutzer" :value="totalUsers" icon="👤" to="/admin/users" />
          <IOSStatCard title="Tagesberichte" :value="totalDailyReports" icon="📄" to="/admin/daily-reports" />
          <IOSStatCard title="Bildungsbereiche" :value="totalLearningThemes" icon="🎨" to="/admin/learning-themes" />
          <IOSStatCard title="Beobachtungen" :value="totalObservations" icon="👁️" to="/admin/observations" />
        </div>
      </div>

      <NuxtLink v-if="pendingLeaveRequests > 0" to="/admin/leave" class="block">
        <IOSStatCard 
          title="Ausstehende Urlaubsanträge" 
          :value="pendingLeaveRequests" 
          icon="📝"
          subtitle="Benötigt Ihre Aufmerksamkeit"
        />
      </NuxtLink>

      <!-- Quick Actions and Links -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IOSCard customClass="p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-1">Schnellaktionen</h3>
          <p class="text-sm text-gray-600 mb-4">Häufige Aufgaben</p>
          <div class="space-y-2">
            <NuxtLink
              to="/admin/children/new"
              class="flex items-center gap-3 px-4 py-3 ios-glass ios-rounded hover:scale-105 transition-transform"
            >
              <span>➕</span>
              <span class="font-medium text-gray-900">Neues Kind hinzufügen</span>
            </NuxtLink>
            <NuxtLink
              to="/admin/users/new"
              class="flex items-center gap-3 px-4 py-3 ios-glass ios-rounded hover:scale-105 transition-transform"
            >
              <span>➕</span>
              <span class="font-medium text-gray-900">Benutzer erstellen</span>
            </NuxtLink>
            <NuxtLink
              to="/admin/groups/new"
              class="flex items-center gap-3 px-4 py-3 ios-glass ios-rounded hover:scale-105 transition-transform"
            >
              <span>➕</span>
              <span class="font-medium text-gray-900">Gruppe erstellen</span>
            </NuxtLink>
            <NuxtLink
              to="/admin/attendance"
              class="flex items-center gap-3 px-4 py-3 ios-glass ios-rounded hover:scale-105 transition-transform"
            >
              <span>📊</span>
              <span class="font-medium text-gray-900">Anwesenheitsberichte anzeigen</span>
            </NuxtLink>
            <NuxtLink
              v-if="pendingLeaveRequests > 0"
              to="/admin/leave"
              class="flex items-center gap-3 px-4 py-3 ios-glass ios-rounded hover:scale-105 transition-transform"
            >
              <span>📝</span>
              <span class="font-medium text-gray-900">Urlaubsanträge prüfen ({{ pendingLeaveRequests }})</span>
            </NuxtLink>
          </div>
        </IOSCard>

        <IOSCard customClass="p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-1">Schnellzugriff</h3>
          <p class="text-sm text-gray-600 mb-4">Zu Hauptbereichen navigieren</p>
          <div class="grid grid-cols-1 gap-2">
            <NuxtLink
              v-for="link in quickLinks"
              :key="link.path"
              :to="link.path"
              class="flex items-center gap-3 px-4 py-2.5 ios-glass ios-rounded hover:scale-105 transition-transform"
            >
              <span class="text-lg">{{ link.icon }}</span>
              <span class="text-gray-900 font-medium">{{ link.label }}</span>
            </NuxtLink>
          </div>
        </IOSCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
import IOSStatCard from '~/components/common/IOSStatCard.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import IOSCard from '~/components/ui/IOSCard.vue'

const quickLinks = computed(() => [
  { path: '/admin/children', label: 'Kinder verwalten', icon: '👶' },
  { path: '/admin/staff', label: 'Personal verwalten', icon: '👥' },
  { path: '/admin/users', label: 'Benutzer verwalten', icon: '👤' },
  { path: '/admin/groups', label: 'Gruppen verwalten', icon: '👪' },
  { path: '/admin/daily-reports', label: 'Tagesberichte', icon: '📄' },
  { path: '/admin/observations', label: 'Beobachtungen', icon: '👁️' },
  { path: '/admin/portfolios', label: 'Portfolios', icon: '📔' },
  { path: '/admin/learning-themes', label: 'Bildungsbereiche', icon: '🎨' },
  { path: '/admin/daily-routines', label: 'Tagesablauf', icon: '⏰' },
  { path: '/admin/lunch/menus', label: 'Mittagessen-Menüs', icon: '🍽️' },
  { path: '/admin/messages', label: 'Nachrichten', icon: '💬' }
])

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
