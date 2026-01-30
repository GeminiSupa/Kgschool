<template>
  <div class="relative inline-block text-left" ref="menuRef">
    <button
      @click="toggleMenu"
      class="inline-flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label="Actions"
    >
      <span class="text-lg">⋯</span>
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
        v-if="isOpen"
        class="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
        style="min-width: 12rem;"
      >
        <div class="py-1">
          <button
            v-if="showView"
            @click="handleAction('view')"
            class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <span>👁️</span>
            <span>{{ viewLabel || 'View' }}</span>
          </button>
          <button
            v-if="showEdit"
            @click="handleAction('edit')"
            class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <span>✏️</span>
            <span>{{ editLabel || 'Edit' }}</span>
          </button>
          <button
            v-if="showDelete"
            @click="handleAction('delete')"
            class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <span>🗑️</span>
            <span>{{ deleteLabel || 'Delete' }}</span>
          </button>
          <slot />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Props {
  showView?: boolean
  showEdit?: boolean
  showDelete?: boolean
  viewLabel?: string
  editLabel?: string
  deleteLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  showView: true,
  showEdit: true,
  showDelete: true
})

const emit = defineEmits<{
  view: []
  edit: []
  delete: []
}>()

const isOpen = ref(false)
const menuRef = ref<HTMLElement>()

const toggleMenu = () => {
  isOpen.value = !isOpen.value
}

const handleAction = (action: 'view' | 'edit' | 'delete') => {
  isOpen.value = false
  emit(action)
}

const handleClickOutside = (event: MouseEvent) => {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
