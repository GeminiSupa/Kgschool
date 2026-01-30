<template>
  <div>
    <NuxtLink
      to="/admin/lunch/menus"
      class="inline-block text-blue-600 hover:text-blue-700 mb-4"
    >
      ← Use Admin Menu Management
    </NuxtLink>
    
    <div class="flex justify-between items-center mb-6">
      <Heading size="xl">Lunch Menus</Heading>
      <NuxtLink
        to="/admin/lunch/menus/new"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        ➕ Add Menu
      </NuxtLink>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
      <p class="text-gray-600">
        Menu management is available through the Admin section. 
        <NuxtLink to="/admin/lunch/menus" class="text-blue-600 hover:text-blue-700">
          Click here to manage menus
        </NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import Heading from '~/components/ui/Heading.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'kitchen'
})
</script>
