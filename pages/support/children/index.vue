<template>
  <div>
    <Heading size="xl" class="mb-6">Children (Read-Only)</Heading>

    <div class="mb-4">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search children..."
        class="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <div v-if="filteredChildren.length === 0" class="p-8 text-center text-gray-500">
        No children found.
      </div>

      <div v-else class="divide-y divide-gray-200">
        <div
          v-for="child in filteredChildren"
          :key="child.id"
          class="p-4 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-900">
                {{ child.first_name }} {{ child.last_name }}
              </p>
              <p class="text-sm text-gray-600 mt-1">
                Group: {{ getGroupName(child.group_id) || 'Unassigned' }}
              </p>
              <p class="text-xs text-gray-500 mt-1">
                DOB: {{ formatDate(child.date_of_birth) }} | Status: {{ child.status }}
              </p>
            </div>
            <NuxtLink
              :to="`/parent/children/${child.id}`"
              class="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
            >
              View Details
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
import { useGroupsStore } from '~/stores/groups'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'support'
})

const supabase = useSupabaseClient()
const groupsStore = useGroupsStore()

const loading = ref(true)
const error = ref('')
const children = ref<any[]>([])
const searchQuery = ref('')

const filteredChildren = computed(() => {
  if (!searchQuery.value) return children.value
  
  const query = searchQuery.value.toLowerCase()
  return children.value.filter(child => 
    child.first_name.toLowerCase().includes(query) ||
    child.last_name.toLowerCase().includes(query)
  )
})

onMounted(async () => {
  try {
    await Promise.all([
      fetchChildren(),
      groupsStore.fetchGroups()
    ])
  } catch (e: any) {
    error.value = e.message || 'Failed to load children'
  } finally {
    loading.value = false
  }
})

const fetchChildren = async () => {
  try {
    const { data, error: fetchError } = await supabase
      .from('children')
      .select('*')
      .eq('status', 'active')
      .order('first_name')

    if (fetchError) throw fetchError
    children.value = data || []
  } catch (e: any) {
    error.value = e.message
  }
}

const getGroupName = (groupId: string) => {
  const group = groupsStore.groups.find(g => g.id === groupId)
  return group?.name || ''
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}
</script>
