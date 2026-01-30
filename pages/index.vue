<template>
  <div></div>
</template>

<script setup lang="ts">
// Redirect to login page
definePageMeta({
  layout: 'auth'
})

// Redirect immediately to login
await navigateTo('/login')
</script>
