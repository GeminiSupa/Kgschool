<template>
  <div>
    <Heading size="xl" class="mb-6">Settings</Heading>

    <div class="space-y-6">
      <!-- System Settings -->
      <div class="bg-white rounded-lg shadow p-6">
        <Heading size="md" class="mb-4">System Settings</Heading>
        <p class="text-gray-600 text-sm">System-wide configuration options will be available here.</p>
      </div>

      <!-- Account Settings -->
      <div class="bg-white rounded-lg shadow p-6">
        <Heading size="md" class="mb-4">Account Settings</Heading>
        <div class="space-y-4">
          <NuxtLink
            to="/profile"
            class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div>
              <p class="font-medium text-gray-900">Manage Profile</p>
              <p class="text-sm text-gray-500">Update your profile information and avatar</p>
            </div>
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </NuxtLink>
        </div>
      </div>

      <!-- Application Info -->
      <div class="bg-white rounded-lg shadow p-6">
        <Heading size="md" class="mb-4">Application Information</Heading>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">Version</span>
            <span class="text-gray-900">1.0.0</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Environment</span>
            <span class="text-gray-900">{{ environment }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Heading from '~/components/ui/Heading.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const environment = process.env.NODE_ENV || 'development'
</script>
