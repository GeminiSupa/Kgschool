<template>
  <NuxtLink v-if="to" :to="to" class="ios-stat-card ios-animate ios-press block no-underline" :class="customClass">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <p class="ios-stat-label">{{ title }}</p>
        <p class="ios-stat-value">{{ formatValue }}</p>
        <p v-if="subtitle" class="ios-stat-subtitle">{{ subtitle }}</p>
      </div>
      <div v-if="icon" class="ios-stat-icon">{{ icon }}</div>
    </div>
    <div v-if="trend" class="ios-stat-trend">
      <div class="flex items-center text-xs" :class="trend.type === 'up' ? 'text-green-500' : 'text-red-500'">
        <span v-if="trend.type === 'up'">↑</span>
        <span v-else>↓</span>
        <span class="ml-1">{{ trend.value }}</span>
      </div>
    </div>
  </NuxtLink>
  <div v-else class="ios-stat-card ios-animate ios-press" :class="customClass">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <p class="ios-stat-label">{{ title }}</p>
        <p class="ios-stat-value">{{ formatValue }}</p>
        <p v-if="subtitle" class="ios-stat-subtitle">{{ subtitle }}</p>
      </div>
      <div v-if="icon" class="ios-stat-icon">{{ icon }}</div>
    </div>
    <div v-if="trend" class="ios-stat-trend">
      <div class="flex items-center text-xs" :class="trend.type === 'up' ? 'text-green-500' : 'text-red-500'">
        <span v-if="trend.type === 'up'">↑</span>
        <span v-else>↓</span>
        <span class="ml-1">{{ trend.value }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title: string
  value: number | string
  icon?: string
  subtitle?: string
  trend?: {
    type: 'up' | 'down'
    value: string
  }
  customClass?: string
  to?: string
}

const props = defineProps<Props>()

const formatValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toLocaleString()
  }
  return props.value
})
</script>

<style scoped>
.ios-stat-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  display: block;
}

.ios-stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.5);
}

.ios-stat-label {
  font-size: 13px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.6);
  margin-bottom: 8px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.ios-stat-value {
  font-size: 32px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.9);
  line-height: 1.2;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.ios-stat-subtitle {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
  margin-top: 6px;
}

.ios-stat-icon {
  font-size: 36px;
  opacity: 0.8;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.ios-stat-trend {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .ios-stat-card {
    padding: 16px;
    border-radius: 16px;
  }
  
  .ios-stat-value {
    font-size: 28px;
  }
  
  .ios-stat-icon {
    font-size: 32px;
  }
}

@media (prefers-color-scheme: dark) {
  .ios-stat-card {
    background: rgba(30, 30, 30, 0.7);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .ios-stat-label {
    color: rgba(255, 255, 255, 0.7);
  }
  
  .ios-stat-value {
    color: rgba(255, 255, 255, 0.95);
  }
  
  .ios-stat-subtitle {
    color: rgba(255, 255, 255, 0.6);
  }
}
</style>
