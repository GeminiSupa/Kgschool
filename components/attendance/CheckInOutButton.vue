<template>
  <div class="flex gap-2">
    <button
      v-if="!hasCheckIn"
      @click="handleCheckIn"
      :disabled="loading"
      class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Check In
    </button>
    <div v-else class="px-3 py-1.5 text-sm bg-green-100 text-green-800 rounded-md">
      In: {{ formatTime(checkInTime) }}
    </div>

    <button
      v-if="hasCheckIn && !hasCheckOut"
      @click="handleCheckOut"
      :disabled="loading"
      class="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Check Out
    </button>
    <div v-else-if="hasCheckOut" class="px-3 py-1.5 text-sm bg-gray-100 text-gray-800 rounded-md">
      Out: {{ formatTime(checkOutTime) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  childId: string
  date: string
  checkInTime?: string
  checkOutTime?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  checkInTime: undefined,
  checkOutTime: undefined,
  loading: false
})

const emit = defineEmits<{
  (e: 'check-in', childId: string, date: string): void
  (e: 'check-out', childId: string, date: string): void
}>()

const hasCheckIn = computed(() => !!props.checkInTime)
const hasCheckOut = computed(() => !!props.checkOutTime)

const handleCheckIn = () => {
  emit('check-in', props.childId, props.date)
}

const handleCheckOut = () => {
  emit('check-out', props.childId, props.date)
}

const formatTime = (time: string) => {
  return new Date(time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}
</script>
