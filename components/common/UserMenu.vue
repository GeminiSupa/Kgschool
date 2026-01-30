<template>
  <div class="relative" ref="menuRef">
    <button
      @click="toggleMenu"
      type="button"
      class="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label="User menu"
      :aria-expanded="showMenu"
    >
      <div
        v-if="authStore.profile?.avatar_url"
        class="w-8 h-8 rounded-full overflow-hidden border border-gray-200 flex-shrink-0"
      >
        <img
          :src="authStore.profile.avatar_url"
          :alt="displayName"
          class="w-full h-full object-cover"
        />
      </div>
      <div
        v-else
        class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
      >
        {{ initials }}
      </div>
      <div class="hidden md:flex flex-col items-start leading-tight">
        <span class="text-sm font-medium text-gray-700">{{ displayName }}</span>
        <span class="text-xs text-blue-600 capitalize">{{ displayRole }}</span>
      </div>
      <svg
        class="w-4 h-4 text-gray-500 ml-1"
        :class="{ 'rotate-180': showMenu }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="showMenu"
        class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[100]"
        @click.stop
      >
        <!-- User Info -->
        <div class="px-4 py-3 border-b border-gray-200">
          <p class="text-sm font-semibold text-gray-900">{{ authStore.profile?.full_name || 'Benutzer' }}</p>
          <p class="text-xs text-gray-500 mt-0.5">{{ authStore.profile?.email || '' }}</p>
          <p class="text-xs text-blue-600 mt-1 capitalize font-medium">{{ authStore.profile?.role || '' }}</p>
        </div>

        <!-- Menu Items -->
        <div class="py-1">
          <NuxtLink
            to="/profile"
            class="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            @click="closeMenu"
          >
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Mein Profil</span>
          </NuxtLink>

          <NuxtLink
            v-if="authStore.isAdmin"
            to="/admin/settings"
            class="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            @click="closeMenu"
          >
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Einstellungen</span>
          </NuxtLink>

          <div class="border-t border-gray-200 my-1"></div>

          <button
            @click="handleLogout"
            type="button"
            class="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
          >
            <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Abmelden</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useAuth } from '~/composables/useAuth'

const authStore = useAuthStore()
const { logout } = useAuth()
const menuRef = ref<HTMLElement | null>(null)
const showMenu = ref(false)

const displayName = computed(() => {
  return authStore.profile?.full_name
    || authStore.profile?.email
    || authStore.user?.email
    || 'User'
})

const displayRole = computed(() => {
  return authStore.profile?.role
    || (authStore.user ? 'admin' : 'user')
})

const initials = computed(() => {
  const name = displayName.value
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'
})

const toggleMenu = () => {
  showMenu.value = !showMenu.value
}

const closeMenu = () => {
  showMenu.value = false
}

const handleLogout = async () => {
  closeMenu()
  try {
    await logout()
  } catch (error) {
    console.error('Logout error:', error)
  }
}

// Click outside handler
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (menuRef.value && !menuRef.value.contains(target)) {
    closeMenu()
  }
}

// Close menu on escape key
const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && showMenu.value) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
  
  // Add click outside listener when menu is open
  watch(showMenu, async (isOpen) => {
    if (isOpen) {
      await nextTick()
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside, true)
      }, 0)
    } else {
      document.removeEventListener('click', handleClickOutside, true)
    }
  })
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  document.removeEventListener('click', handleClickOutside, true)
})
</script>
