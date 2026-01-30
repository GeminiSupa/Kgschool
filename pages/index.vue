<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
      <h1 class="text-3xl font-bold text-blue-600 mb-4">
        Kindergarten Management System
      </h1>
      <p class="text-gray-600 mb-6">
        Welcome to your kindergarten management platform
      </p>
      <div class="space-y-3">
        <NuxtLink
          to="/login"
          class="block w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Login
        </NuxtLink>
        <NuxtLink
          to="/signup"
          class="block w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-md hover:bg-gray-300 transition-colors"
        >
          Sign Up
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Welcome page - use auth layout (no sidebar/header)
definePageMeta({
  layout: 'auth'
})
</script>
