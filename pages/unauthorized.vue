<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
      <div class="text-6xl mb-4">🔒</div>
      <h1 class="text-2xl font-bold text-gray-900 mb-4">Unauthorized Access</h1>
      <p class="text-gray-600 mb-6">
        You don't have permission to access this page.
      </p>
      <NuxtLink
        to="/"
        class="inline-block bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors"
      >
        Go to Home
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
// Use auth layout (no sidebar/header)
definePageMeta({
  layout: 'auth'
})
</script>
