<template>
  <div>
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink
        to="/parent/children"
        class="text-gray-600 hover:text-gray-900"
      >
        ← Back to My Children
      </NuxtLink>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else-if="child" class="bg-white rounded-lg shadow p-6 max-w-2xl">
      <Heading size="xl" class="mb-6">
        {{ child.first_name }} {{ child.last_name }}
      </Heading>

      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-600">Name</label>
            <p class="mt-1 text-gray-900">{{ child.first_name }} {{ child.last_name }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600">Date of Birth</label>
            <p class="mt-1 text-gray-900">{{ formatDate(child.date_of_birth) }}</p>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-600">Group</label>
          <p class="mt-1 text-gray-900">{{ child.group_id || 'Unassigned' }}</p>
        </div>

        <div class="pt-4 border-t space-y-2">
          <NuxtLink
            :to="`/parent/attendance?child=${child.id}`"
            class="block w-full text-left px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
          >
            ✅ View Attendance
          </NuxtLink>
          <NuxtLink
            :to="`/parent/lunch?child=${child.id}`"
            class="block w-full text-left px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
          >
            🍽️ Order Lunch
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useChildrenStore } from '~/stores/children'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'parent'
})

const route = useRoute()
const childrenStore = useChildrenStore()

const child = ref<any>(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const childData = await childrenStore.fetchChildById(route.params.id as string)
    if (!childData) {
      error.value = 'Child not found'
      return
    }
    child.value = childData
  } catch (e: any) {
    error.value = e.message || 'Failed to load child'
  } finally {
    loading.value = false
  }
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}
</script>
