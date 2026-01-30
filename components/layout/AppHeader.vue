<template>
  <header class="bg-white/80 backdrop-blur-xl border-b border-white/20 px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-lg">
    <div class="flex items-center gap-4">
      <!-- Back Button (shown only when not on dashboard) -->
              <button
                v-if="showBackButton"
                @click="goBack"
                class="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
                aria-label="Zurück"
              >
                <span class="text-xl">←</span>
              </button>
              
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span class="text-white font-bold text-sm">KG</span>
                </div>
                <Heading size="lg" class="text-gray-900 font-semibold">
                  Kita Management
                </Heading>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <UserMenu />
            </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Heading from '~/components/ui/Heading.vue'
import UserMenu from '~/components/common/UserMenu.vue'

const route = useRoute()
const router = useRouter()

const showBackButton = computed(() => {
  // Show back button if not on dashboard or home page
  const path = route.path
  const dashboardPaths = ['/admin/dashboard', '/teacher/dashboard', '/parent/dashboard', '/kitchen/dashboard', '/dashboard', '/']
  return !dashboardPaths.includes(path)
})

const goBack = () => {
  // Always land on the role dashboard to avoid bouncing to an unrelated page
  const path = route.path
  if (path.startsWith('/admin/')) {
    router.replace('/admin/dashboard')
  } else if (path.startsWith('/teacher/')) {
    router.replace('/teacher/dashboard')
  } else if (path.startsWith('/parent/')) {
    router.replace('/parent/dashboard')
  } else if (path.startsWith('/kitchen/')) {
    router.replace('/kitchen/dashboard')
  } else {
    router.replace('/dashboard')
  }
}
</script>
