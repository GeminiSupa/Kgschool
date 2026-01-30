<template>
  <div class="flex flex-col min-h-screen">
    <slot name="header" />
    <div class="flex flex-1 overflow-hidden">
      <aside
        v-if="showSidebar"
        class="hidden md:block bg-white border-r border-gray-200 overflow-hidden shadow-sm transition-all duration-200"
        :style="{ width: sidebarWidth }"
      >
        <slot name="sidebar" />
      </aside>
      <main class="flex-1 overflow-y-auto bg-gray-50">
        <slot name="content" />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  showSidebar?: boolean
  collapsed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showSidebar: true,
  collapsed: false
})

const sidebarWidth = computed(() => (props.collapsed ? '80px' : '280px'))
</script>
