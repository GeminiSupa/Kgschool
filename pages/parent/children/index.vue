<template>
  <div>
    <Heading size="xl" class="mb-6">My Children</Heading>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <div v-if="myChildren.length === 0" class="p-8 text-center text-gray-500">
        No children registered yet.
      </div>

      <div v-else class="divide-y divide-gray-200">
        <NuxtLink
          v-for="child in myChildren"
          :key="child.id"
          :to="`/parent/children/${child.id}`"
          class="block p-6 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-lg font-medium text-gray-900">
                {{ child.first_name }} {{ child.last_name }}
              </p>
              <p class="text-sm text-gray-600 mt-1">
                Group: {{ child.group_id || 'Unassigned' }}
              </p>
            </div>
            <span
              :class="[
                'px-2 py-1 text-xs font-medium rounded-full',
                child.status === 'active' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              ]"
            >
              {{ child.status }}
            </span>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
import { useAuthStore } from '~/stores/auth'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'parent'
})

const supabase = useSupabaseClient()
const authStore = useAuthStore()
const loading = ref(true)
const error = ref('')
const myChildren = ref<any[]>([])

onMounted(async () => {
  try {
    const userId = authStore.user?.id
    if (!userId) return

    const { data: children, error: err } = await supabase
      .from('children')
      .select('*')
      .contains('parent_ids', [userId])
      .order('first_name')

    if (err) throw err
    myChildren.value = children || []
  } catch (e: any) {
    error.value = e.message || 'Failed to load children'
  } finally {
    loading.value = false
  }
})
</script>
