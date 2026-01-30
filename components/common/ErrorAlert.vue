<template>
  <div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
    <p class="font-medium">{{ title || 'Error' }}</p>
    <p v-if="message" class="text-sm mt-1">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  message?: string
}

withDefaults(defineProps<Props>(), {
  title: 'Error'
})
</script>
