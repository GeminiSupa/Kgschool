<template>
  <div class="flex items-center gap-2">
    <div class="flex-1">
      <div class="flex items-center justify-between mb-1">
        <span class="text-sm font-medium text-gray-700">Capacity</span>
        <span class="text-sm font-medium" :class="capacityClass">
          {{ current }} / {{ max }}
        </span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div
          class="h-2 rounded-full transition-all"
          :class="progressBarClass"
          :style="{ width: `${utilizationPercent}%` }"
        />
      </div>
    </div>
    <span
      v-if="warning"
      class="text-xs px-2 py-1 rounded-full"
      :class="warningClass"
    >
      {{ warning }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  current: number
  max: number
}

const props = defineProps<Props>()

const utilizationPercent = computed(() => {
  if (props.max === 0) return 0
  return Math.min(100, (props.current / props.max) * 100)
})

const capacityClass = computed(() => {
  const percent = utilizationPercent.value
  if (percent >= 100) return 'text-red-600'
  if (percent >= 90) return 'text-orange-600'
  if (percent >= 80) return 'text-yellow-600'
  return 'text-green-600'
})

const progressBarClass = computed(() => {
  const percent = utilizationPercent.value
  if (percent >= 100) return 'bg-red-600'
  if (percent >= 90) return 'bg-orange-600'
  if (percent >= 80) return 'bg-yellow-600'
  return 'bg-green-600'
})

const warning = computed(() => {
  const percent = utilizationPercent.value
  if (percent >= 100) return 'Full'
  if (percent >= 90) return 'Nearly Full'
  if (percent >= 80) return 'Getting Full'
  return null
})

const warningClass = computed(() => {
  const percent = utilizationPercent.value
  if (percent >= 100) return 'bg-red-100 text-red-800'
  if (percent >= 90) return 'bg-orange-100 text-orange-800'
  if (percent >= 80) return 'bg-yellow-100 text-yellow-800'
  return ''
})
</script>
