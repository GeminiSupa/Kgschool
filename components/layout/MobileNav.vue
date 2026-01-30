<template>
  <ClientOnly>
    <nav
      class="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-white/20 z-50 shadow-lg flex ios-safe-bottom"
    >
      <NuxtLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex-1 p-3 text-center"
        :class="isActive(item.path) ? 'text-blue-600' : 'text-gray-400'"
      >
        <span class="text-2xl block">{{ item.icon }}</span>
        <span class="text-xs mt-1 block">{{ item.label }}</span>
      </NuxtLink>
    </nav>
    <template #fallback>
      <div class="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 z-50"></div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

const route = useRoute()
const authStore = useAuthStore()

const navItems = computed(() => {
  const role = authStore.userRole
  const items: Array<{ path: string; label: string; icon: string }> = []

  if (role === 'admin') {
    items.push(
      { path: '/admin/dashboard', label: 'Startseite', icon: '🏠' },
      { path: '/admin/children', label: 'Kinder', icon: '👶' },
      { path: '/admin/daily-reports', label: 'Berichte', icon: '📄' },
      { path: '/admin/observations', label: 'Beobachten', icon: '👁️' },
      { path: '/admin/messages', label: 'Nachrichten', icon: '💬' }
    )
  } else if (role === 'teacher') {
    items.push(
      { path: '/teacher/dashboard', label: 'Startseite', icon: '🏠' },
      { path: '/teacher/children', label: 'Kinder', icon: '👶' },
      { path: '/teacher/daily-reports', label: 'Berichte', icon: '📄' },
      { path: '/teacher/observations', label: 'Beobachten', icon: '👁️' },
      { path: '/teacher/messages', label: 'Nachrichten', icon: '💬' }
    )
  } else if (role === 'parent') {
    items.push(
      { path: '/parent/dashboard', label: 'Startseite', icon: '🏠' },
      { path: '/parent/children', label: 'Kinder', icon: '👶' },
      { path: '/parent/daily-reports', label: 'Berichte', icon: '📄' },
      { path: '/parent/portfolios', label: 'Portfolio', icon: '📔' },
      { path: '/parent/messages', label: 'Nachrichten', icon: '💬' }
    )
  } else if (role === 'kitchen') {
    items.push(
      { path: '/kitchen/dashboard', label: 'Startseite', icon: '🏠' },
      { path: '/kitchen/menus', label: 'Menüs', icon: '🍽️' },
      { path: '/kitchen/orders', label: 'Bestellungen', icon: '🛒' }
    )
  }

  return items.slice(0, 5)
})

const isActive = (path: string) => {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>
