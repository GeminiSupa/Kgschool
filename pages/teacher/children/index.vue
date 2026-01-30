<template>
  <div>
    <Heading size="xl" class="mb-6">My Children</Heading>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else class="space-y-6">
      <!-- Group Filter -->
      <div v-if="myGroups.length > 1" class="bg-white rounded-lg shadow p-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Filter by Group</label>
        <select
          v-model="selectedGroupId"
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Groups</option>
          <option v-for="group in myGroups" :key="group.id" :value="group.id">
            {{ group.name }} ({{ group.age_range }})
          </option>
        </select>
      </div>

      <!-- Children List -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div v-if="filteredChildren.length === 0" class="p-8 text-center text-gray-500">
          <p v-if="selectedGroupId">No children in selected group.</p>
          <p v-else>No children assigned to you yet.</p>
        </div>

        <div v-else class="divide-y divide-gray-200">
          <NuxtLink
            v-for="child in filteredChildren"
            :key="child.id"
            :to="`/teacher/children/${child.id}`"
            class="block p-6 hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-lg font-medium text-gray-900">
                  {{ child.first_name }} {{ child.last_name }}
                </p>
                <p class="text-sm text-gray-600 mt-1">
                  Date of Birth: {{ formatDate(child.date_of_birth) }}
                </p>
                <p v-if="child.group_name" class="text-xs text-gray-500 mt-1">
                  Group: {{ child.group_name }}
                </p>
              </div>
              <span
                :class="[
                  'px-2 py-1 text-xs font-medium rounded-full',
                  child.status === 'active' ? 'bg-green-100 text-green-800' :
                  child.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                ]"
              >
                {{ child.status }}
              </span>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
import { useAuthStore } from '~/stores/auth'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'teacher'
})

const supabase = useSupabaseClient()
const authStore = useAuthStore()
const loading = ref(true)
const error = ref('')
const myChildren = ref<any[]>([])
const myGroups = ref<any[]>([])
const selectedGroupId = ref('')

const filteredChildren = computed(() => {
  if (!selectedGroupId.value) return myChildren.value
  return myChildren.value.filter(c => c.group_id === selectedGroupId.value)
})

onMounted(async () => {
  try {
    const userId = authStore.user?.id
    if (!userId) return

    const allChildrenMap = new Map<string, any>()

    // 1. Get children from groups where teacher is assigned
    const { data: groupAssignments, error: groupAssignError } = await supabase
      .from('group_teachers')
      .select('*, groups(*)')
      .eq('teacher_id', userId)
      .is('end_date', null)

    if (groupAssignError) throw groupAssignError

    if (groupAssignments && groupAssignments.length > 0) {
      const groupIds = groupAssignments.map((a: any) => a.group_id)
      myGroups.value = groupAssignments.map((a: any) => a.groups).filter(Boolean)

      // Get children from my groups
      const { data: groupChildren, error: groupChildrenError } = await supabase
        .from('children')
        .select('*, groups(name)')
        .in('group_id', groupIds)
        .eq('status', 'active')
        .order('first_name')

      if (groupChildrenError) throw groupChildrenError

      // Add children from groups to map
      if (groupChildren) {
        groupChildren.forEach((child: any) => {
          allChildrenMap.set(child.id, {
            ...child,
            group_name: child.groups?.name,
            assignment_source: 'group'
          })
        })
      }
    }

    // 2. Get children directly assigned via staff_assignments table
    const today = new Date().toISOString().split('T')[0]
    
    // First, get active staff assignments
    const { data: staffAssignments, error: staffAssignError } = await supabase
      .from('staff_assignments')
      .select('child_id')
      .eq('staff_id', userId)
      .lte('start_date', today)
      .or(`end_date.is.null,end_date.gte.${today}`)

    if (staffAssignError) {
      console.error('Error fetching staff assignments:', staffAssignError)
      // Don't throw - continue with group children if available
    } else if (staffAssignments && staffAssignments.length > 0) {
      // Get unique child IDs from assignments
      const assignedChildIds = [...new Set(staffAssignments.map((sa: any) => sa.child_id).filter(Boolean))]

      if (assignedChildIds.length > 0) {
        // Fetch children details
        const { data: assignedChildren, error: assignedChildrenError } = await supabase
          .from('children')
          .select('*, groups(name)')
          .in('id', assignedChildIds)
          .eq('status', 'active')
          .order('first_name')

        if (assignedChildrenError) {
          console.error('Error fetching assigned children:', assignedChildrenError)
        } else if (assignedChildren) {
          // Add or update children in map
          assignedChildren.forEach((child: any) => {
            const existing = allChildrenMap.get(child.id)
            allChildrenMap.set(child.id, {
              ...child,
              group_name: child.groups?.name,
              assignment_source: existing ? 'both' : 'direct'
            })
          })
        }
      }
    }

    // Convert map to array and remove duplicates
    myChildren.value = Array.from(allChildrenMap.values())
    
    // If no children found from either source, show appropriate message
    if (myChildren.value.length === 0) {
      console.log('No children found for teacher:', userId)
    }
  } catch (e: any) {
    console.error('Error loading children:', e)
    error.value = e.message || 'Failed to load children'
  } finally {
    loading.value = false
  }
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}
</script>
