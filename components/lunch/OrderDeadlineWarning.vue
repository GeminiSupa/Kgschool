<template>
  <div
    :class="[
      'p-4 rounded-md border-2',
      isDeadlinePassed
        ? 'bg-yellow-50 border-yellow-300'
        : 'bg-blue-50 border-blue-300'
    ]"
  >
    <div class="flex items-start">
      <div class="flex-shrink-0">
        <span v-if="isDeadlinePassed" class="text-2xl">⚠️</span>
        <span v-else class="text-2xl">⏰</span>
      </div>
      <div class="ml-3 flex-1">
        <h4
          :class="[
            'text-sm font-medium',
            isDeadlinePassed ? 'text-yellow-800' : 'text-blue-800'
          ]"
        >
          {{ isDeadlinePassed ? 'Deadline Passed' : 'Order Deadline' }}
        </h4>
        <p
          :class="[
            'mt-1 text-sm',
            isDeadlinePassed ? 'text-yellow-700' : 'text-blue-700'
          ]"
        >
          <span v-if="!isDeadlinePassed">
            Cancel by <strong>8:00 AM today</strong> to avoid charges.
          </span>
          <span v-else>
            The cancellation deadline has passed. You will be charged for this order even if your child doesn't eat lunch.
          </span>
        </p>
        <div v-if="!isDeadlinePassed && timeRemaining" class="mt-2">
          <p class="text-xs font-medium text-blue-600">
            Time remaining: {{ timeRemaining }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  orderDate: string
}>()

const currentTime = ref(new Date())
let intervalId: NodeJS.Timeout | null = null

const deadline = computed(() => {
  const date = new Date(props.orderDate)
  date.setHours(8, 0, 0, 0)
  return date
})

const isDeadlinePassed = computed(() => {
  return currentTime.value >= deadline.value
})

const timeRemaining = computed(() => {
  if (isDeadlinePassed.value) return null

  const diff = deadline.value.getTime() - currentTime.value.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m`
  } else {
    return 'Less than a minute'
  }
})

onMounted(() => {
  // Update time every minute
  intervalId = setInterval(() => {
    currentTime.value = new Date()
  }, 60000)
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})
</script>
