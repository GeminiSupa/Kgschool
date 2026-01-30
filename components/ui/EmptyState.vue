<template>
  <div class="empty-state-fiori">
    <div v-if="icon" class="empty-state-fiori-icon">{{ icon }}</div>
    <h3 v-if="title" class="empty-state-fiori-title">{{ title }}</h3>
    <p v-if="description" class="empty-state-fiori-description">{{ description }}</p>
    <div v-if="$slots.actions" class="mt-6">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  icon?: string
  title?: string
  description?: string
}

defineProps<Props>()
</script>
