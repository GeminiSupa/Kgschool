<template>
  <div
    class="h-full flex flex-col sidebar-container bg-white/80 backdrop-blur-xl border-r border-white/20 transition-all duration-200"
    :class="{ 'sidebar-collapsed': collapsed }"
  >
    <!-- Sidebar Header -->
    <div class="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
      <div class="flex items-center gap-2 min-w-0">
        <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
          KG
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-xs font-semibold text-gray-900 truncate sidebar-label">Kita Management</p>
          <p class="text-xs text-gray-500 truncate flex items-center gap-1 sidebar-label">
            <span v-if="loadingRole" class="inline-flex h-4 w-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            <span>{{ userRoleLabel }}</span>
          </p>
        </div>
      </div>
      <button
        class="flex-shrink-0 w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800 transition"
        @click="toggleCollapse"
        aria-label="Sidebar ein/ausklappen"
      >
        <span v-if="collapsed">»</span>
        <span v-else>«</span>
      </button>
    </div>
    
    <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      <template v-if="loadingRole">
        <div
          v-for="i in 8"
          :key="i"
          class="h-11 px-4 rounded-lg bg-gray-100 animate-pulse"
        ></div>
      </template>
      <template v-else>
        <NuxtLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          :class="[
            'group relative flex items-center gap-3 px-4 py-3 ios-rounded',
            'text-sm font-medium ios-animate ios-press',
            'hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
            isActive(item.path)
              ? 'bg-blue-50 text-blue-700 shadow-sm font-semibold ios-glass'
              : 'text-gray-700 hover:text-blue-700'
          ]"
        >
          <!-- Active indicator bar -->
          <span
            v-if="isActive(item.path)"
            class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full"
          />
          
          <!-- Icon -->
          <span
            :class="[
              'text-xl flex-shrink-0 transition-transform duration-200',
              isActive(item.path) ? 'scale-110' : 'group-hover:scale-110'
            ]"
          >
            {{ item.icon }}
          </span>
          
          <!-- Label -->
          <span class="truncate flex-1 sidebar-label">{{ item.label }}</span>
          
          <!-- Hover arrow indicator -->
          <span
            v-if="!isActive(item.path)"
            class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-blue-600"
          >
            →
          </span>
        </NuxtLink>
      </template>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSupabaseClient } from '#imports'
import { useAuthStore } from '~/stores/auth'

const route = useRoute()
const authStore = useAuthStore()
const supabase = useSupabaseClient()
const loadingRole = ref(true)
const collapsedInternal = ref(false)

const props = defineProps<{
  collapsed?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:collapsed', value: boolean): void
}>()

const collapsed = computed({
  get: () => props.collapsed ?? collapsedInternal.value,
  set: (val: boolean) => {
    collapsedInternal.value = val
    emit('update:collapsed', val)
  }
})

const effectiveRole = computed(() => {
  // First check if we have a role in the store
  if (authStore.userRole) return authStore.userRole
  
  // Check if profile exists but role is missing
  if (authStore.profile && !authStore.profile.role) {
    console.warn('Sidebar: Profile exists but role is missing')
  }
  
  // If we're on an admin route and have a user, assume admin (fallback)
  if (!loadingRole.value && authStore.user && route.path.startsWith('/admin/')) {
    console.log('Sidebar: Using admin fallback based on route')
    return 'admin'
  }
  
  // If we're on a teacher route and have a user, assume teacher (fallback)
  if (!loadingRole.value && authStore.user && route.path.startsWith('/teacher/')) {
    console.log('Sidebar: Using teacher fallback based on route')
    return 'teacher'
  }
  
  // If we're on a parent route and have a user, assume parent (fallback)
  if (!loadingRole.value && authStore.user && route.path.startsWith('/parent/')) {
    console.log('Sidebar: Using parent fallback based on route')
    return 'parent'
  }
  
  // If we're on a kitchen route and have a user, assume kitchen (fallback)
  if (!loadingRole.value && authStore.user && route.path.startsWith('/kitchen/')) {
    console.log('Sidebar: Using kitchen fallback based on route')
    return 'kitchen'
  }
  
  // If we're on a support route and have a user, assume support (fallback)
  if (!loadingRole.value && authStore.user && route.path.startsWith('/support/')) {
    console.log('Sidebar: Using support fallback based on route')
    return 'support'
  }
  
  return null
})

const navItems = computed(() => {
  const role = effectiveRole.value
  const items: Array<{ path: string; label: string; icon: string }> = []

  // While loading, keep skeleton
  if (loadingRole.value) return items

  // Fallback when no role resolved
  if (!role) {
    items.push({ path: '/dashboard', label: 'Dashboard', icon: '🏠' })
    return items
  }

  if (role === 'admin') {
    items.push(
      { path: '/admin/dashboard', label: 'Dashboard', icon: '🏠' },
      { path: '/admin/children', label: 'Kinder', icon: '👶' },
      { path: '/admin/groups', label: 'Gruppen', icon: '👪' },
      { path: '/admin/staff', label: 'Personal', icon: '👥' },
      { path: '/admin/users', label: 'Benutzer', icon: '👤' },
      { path: '/admin/attendance', label: 'Anwesenheit', icon: '✅' },
      { path: '/admin/calendar', label: 'Kalender', icon: '📅' },
      { path: '/admin/applications', label: 'Bewerbungen', icon: '📋' },
      { path: '/admin/contracts', label: 'Verträge', icon: '📝' },
      { path: '/admin/consents', label: 'Einverständnisse', icon: '✅' },
      { path: '/admin/daily-reports', label: 'Tagesberichte', icon: '📄' },
      { path: '/admin/observations', label: 'Beobachtungen', icon: '👁️' },
      { path: '/admin/portfolios', label: 'Portfolios', icon: '📔' },
      { path: '/admin/learning-themes', label: 'Bildungsbereiche', icon: '🎨' },
      { path: '/admin/daily-routines', label: 'Tagesablauf', icon: '⏰' },
      { path: '/admin/lunch/menus', label: 'Mittagessen', icon: '🍽️' },
      { path: '/admin/lunch/billing', label: 'Abrechnung', icon: '💰' },
      { path: '/admin/fees', label: 'Gebühren', icon: '💳' },
      { path: '/admin/parent-work', label: 'Elternarbeit', icon: '🔧' },
      { path: '/admin/leave', label: 'Urlaub', icon: '🏖️' },
      { path: '/admin/hr/payroll', label: 'Personalabrechnung', icon: '💼' },
      { path: '/admin/messages', label: 'Nachrichten', icon: '💬' },
      { path: '/admin/settings', label: 'Einstellungen', icon: '⚙️' }
    )
  } else if (role === 'teacher') {
    items.push(
      { path: '/teacher/dashboard', label: 'Dashboard', icon: '🏠' },
      { path: '/teacher/children', label: 'Kinder', icon: '👶' },
      { path: '/teacher/attendance', label: 'Anwesenheit', icon: '✅' },
      { path: '/teacher/daily-reports', label: 'Tagesberichte', icon: '📄' },
      { path: '/teacher/observations', label: 'Beobachtungen', icon: '👁️' },
      { path: '/teacher/portfolios', label: 'Portfolios', icon: '📔' },
      { path: '/teacher/leave', label: 'Urlaub', icon: '🏖️' },
      { path: '/teacher/payroll', label: 'Gehalt', icon: '💼' },
      { path: '/teacher/messages', label: 'Nachrichten', icon: '💬' }
    )
  } else if (role === 'parent') {
    items.push(
      { path: '/parent/dashboard', label: 'Dashboard', icon: '🏠' },
      { path: '/parent/children', label: 'Meine Kinder', icon: '👶' },
      { path: '/parent/attendance', label: 'Anwesenheit', icon: '✅' },
      { path: '/parent/daily-reports', label: 'Tagesberichte', icon: '📄' },
      { path: '/parent/observations', label: 'Beobachtungen', icon: '👁️' },
      { path: '/parent/portfolios', label: 'Portfolios', icon: '📔' },
      { path: '/parent/lunch', label: 'Mittagessen', icon: '🍽️' },
      { path: '/parent/fees', label: 'Gebühren', icon: '💰' },
      { path: '/parent/messages', label: 'Nachrichten', icon: '💬' }
    )
  } else if (role === 'kitchen') {
    items.push(
      { path: '/kitchen/dashboard', label: 'Dashboard', icon: '🏠' },
      { path: '/kitchen/menus', label: 'Menüs', icon: '🍽️' },
      { path: '/kitchen/orders', label: 'Bestellungen', icon: '🛒' }
    )
  } else if (role === 'support') {
    items.push(
      { path: '/support/dashboard', label: 'Dashboard', icon: '🏠' },
      { path: '/support/attendance', label: 'Anwesenheit', icon: '✅' },
      { path: '/support/children', label: 'Kinder', icon: '👶' },
      { path: '/support/messages', label: 'Nachrichten', icon: '💬' },
      { path: '/support/reports', label: 'Berichte', icon: '📊' },
      { path: '/support/payroll', label: 'Gehalt', icon: '💼' }
    )
  }

  return items
})

const isActive = (path: string) => {
  return route.path === path || route.path.startsWith(path + '/')
}

const userRoleLabel = computed(() => {
  const role = effectiveRole.value
  const labels: Record<string, string> = {
    admin: 'Administrator',
    teacher: 'Erzieher/in',
    parent: 'Elternteil',
    kitchen: 'Küche',
    support: 'Support'
  }
  if (loadingRole.value) return 'Rolle wird geladen…'
  if (!role) return 'Rolle nicht gesetzt'
  return labels[role] || role
})

const toggleCollapse = () => {
  collapsed.value = !collapsed.value
}

const loadProfile = async () => {
  try {
    // Check if profile already exists and has role
    if (authStore.profile?.role) {
      console.log('Sidebar: Profile already loaded', authStore.profile.role)
      loadingRole.value = false
      return
    }

    // Ensure user is loaded
    if (!authStore.user) {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        authStore.setUser(session.user)
      } else {
        loadingRole.value = false
        return
      }
    }

    // If we have a user but no profile, fetch it aggressively
    if (authStore.user?.id) {
      loadingRole.value = true
      
      // Try fetching profile multiple times with increasing delays
      for (let i = 0; i < 5; i++) {
        await authStore.fetchProfile()
        
        if (authStore.profile?.role) {
          console.log('Sidebar: Profile loaded successfully', authStore.profile.role)
          break
        }
        
        // Wait before retry (exponential backoff)
        if (i < 4) {
          await new Promise(resolve => setTimeout(resolve, 300 * (i + 1)))
        }
      }
      
      // If still no role, log for debugging
      if (!authStore.profile?.role) {
        console.warn('Sidebar: Could not load profile after retries', {
          userId: authStore.user?.id,
          hasProfile: !!authStore.profile,
          profileRole: authStore.profile?.role
        })
      }
    }
  } catch (e) {
    console.error('Sidebar loadProfile error:', e)
  } finally {
    loadingRole.value = false
  }
}

// Watch for profile changes to update nav items reactively
watch(() => authStore.profile?.role, (newRole, oldRole) => {
  if (newRole && newRole !== oldRole) {
    console.log('Sidebar: Profile role changed to', newRole)
    loadingRole.value = false
  }
}, { immediate: true })

// Watch for user changes
watch(() => authStore.user?.id, (newUserId, oldUserId) => {
  if (newUserId && newUserId !== oldUserId && !authStore.profile?.role) {
    console.log('Sidebar: User changed, loading profile')
    loadProfile()
  }
}, { immediate: true })

// Also watch the entire profile object
watch(() => authStore.profile, (newProfile) => {
  if (newProfile?.role) {
    console.log('Sidebar: Profile object changed, role:', newProfile.role)
    loadingRole.value = false
  }
}, { deep: true, immediate: true })

onMounted(async () => {
  // Check if profile already exists
  if (authStore.profile?.role) {
    console.log('Sidebar mounted: Profile already exists', authStore.profile.role)
    loadingRole.value = false
  } else {
    await loadProfile()
  }
})
</script>

<style scoped>
/* Modern Scrollbar Styling */
.sidebar-container nav::-webkit-scrollbar {
  width: 6px;
}

.sidebar-container nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-container nav::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
  transition: background 0.2s ease;
}

.sidebar-container nav:hover::-webkit-scrollbar-thumb {
  background: #94a3b8;
}

.sidebar-container nav::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}

/* Firefox Scrollbar */
.sidebar-container nav {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.sidebar-container nav:hover {
  scrollbar-color: #94a3b8 transparent;
}

.sidebar-container.sidebar-collapsed {
  width: 100%;
}

.sidebar-container.sidebar-collapsed .sidebar-label {
  opacity: 0;
  width: 0;
  max-width: 0;
  overflow: hidden;
}

.sidebar-container.sidebar-collapsed nav .group {
  justify-content: center;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
}

.sidebar-container.sidebar-collapsed nav .group span.text-xl {
  margin-right: 0;
}
</style>
