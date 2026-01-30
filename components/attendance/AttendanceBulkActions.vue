<template>
  <div class="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            :checked="selectAll"
            @change="toggleSelectAll"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-sm font-medium text-gray-700">Select All</span>
        </label>
        <span v-if="selectedCount > 0" class="text-sm text-gray-600">
          {{ selectedCount }} selected
        </span>
      </div>
      <div class="flex gap-2">
        <button
          @click="$emit('mark-all-present')"
          :disabled="selectedCount === 0"
          class="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Mark All Present
        </button>
        <button
          @click="$emit('clear-selection')"
          :disabled="selectedCount === 0"
          class="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear Selection
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  selectAll: boolean
  selectedCount: number
}

defineProps<Props>()

defineEmits<{
  (e: 'toggle-select-all'): void
  (e: 'mark-all-present'): void
  (e: 'clear-selection'): void
}>()
</script>
