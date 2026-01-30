<template>
  <div class="card-fiori hover:shadow-md transition-shadow">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <p class="text-sm font-medium text-fiori-gray-600 mb-1">{{ title }}</p>
        <p class="text-3xl font-bold text-fiori-gray-900">{{ formatValue }}</p>
        <p v-if="subtitle" class="mt-1 text-xs text-fiori-gray-500">{{ subtitle }}</p>
      </div>
      <div v-if="icon" class="text-4xl opacity-60 ml-4">{{ icon }}</div>
    </div>
    <div v-if="trend" class="mt-4 pt-4 border-t border-fiori-gray-200">
      <div class="flex items-center text-xs" :class="trend.type === 'up' ? 'text-green-600' : 'text-red-600'">
        <span v-if="trend.type === 'up'">↑</span>
        <span v-else>↓</span>
        <span class="ml-1">{{ trend.value }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  value: string | number
  icon?: string
  subtitle?: string
  trend?: {
    type: 'up' | 'down'
    value: string
  }
}

const props = defineProps<Props>()

const formatValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toLocaleString()
  }
  return props.value
})
</script>
