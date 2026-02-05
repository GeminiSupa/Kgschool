<template>
  <div class="min-h-screen ios-background">
    <!-- Content Layer -->
    <div class="relative z-10">
      <AppShell :collapsed="sidebarCollapsed">
        <template #header>
          <AppHeader />
        </template>
        <template #sidebar>
          <AppSidebar v-model:collapsed="sidebarCollapsed" />
        </template>
        <template #content>
          <div class="p-4 md:p-6 max-w-7xl mx-auto pb-20 md:pb-6 page-content">
            <slot />
          </div>
        </template>
      </AppShell>
      <ClientOnly>
        <MobileNav />
        <template #fallback>
          <div class="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-t border-gray-200/50 z-50"></div>
        </template>
      </ClientOnly>
    </div>
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppShell from '~/components/layout/AppShell.vue'
import AppHeader from '~/components/layout/AppHeader.vue'
import AppSidebar from '~/components/layout/AppSidebar.vue'
import MobileNav from '~/components/layout/MobileNav.vue'
import Toast from '~/components/common/Toast.vue'

const sidebarCollapsed = ref(false)
</script>
