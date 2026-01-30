<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <NuxtLink
          to="/admin/lunch/billing"
          class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
        >
          ← Back to Billing
        </NuxtLink>
        <Heading size="xl">Billing Timetables</Heading>
        <p class="text-sm text-gray-600 mt-2">
          Configure which days of the week are billable for each group
        </p>
      </div>
      <NuxtLink
        to="/admin/lunch/billing/timetable/new"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        ➕ New Timetable
      </NuxtLink>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <div v-if="timetables.length === 0" class="p-8 text-center text-gray-500">
        No billing timetables configured. 
        <NuxtLink to="/admin/lunch/billing/timetable/new" class="text-blue-600 hover:underline">
          Create one →
        </NuxtLink>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Effective From</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Effective To</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="timetable in timetables" :key="timetable.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ getGroupName(timetable.group_id) }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">
                <div class="flex flex-wrap gap-1">
                  <span v-if="timetable.monday" class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Mon</span>
                  <span v-if="timetable.tuesday" class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Tue</span>
                  <span v-if="timetable.wednesday" class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Wed</span>
                  <span v-if="timetable.thursday" class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Thu</span>
                  <span v-if="timetable.friday" class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Fri</span>
                  <span v-if="timetable.saturday" class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Sat</span>
                  <span v-if="timetable.sunday" class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Sun</span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatDate(timetable.effective_from) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ timetable.effective_to ? formatDate(timetable.effective_to) : 'Ongoing' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <div class="flex gap-2">
                  <NuxtLink
                    :to="`/admin/lunch/billing/timetable/${timetable.id}`"
                    class="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </NuxtLink>
                  <button
                    @click="deleteTimetable(timetable.id)"
                    class="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBillingTimetableStore } from '~/stores/billingTimetable'
import { useGroupsStore } from '~/stores/groups'
import { storeToRefs } from 'pinia'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const timetableStore = useBillingTimetableStore()
const groupsStore = useGroupsStore()

const { timetables, loading, error } = storeToRefs(timetableStore)
const { groups } = storeToRefs(groupsStore)

onMounted(async () => {
  await Promise.all([
    timetableStore.fetchTimetables(),
    groupsStore.fetchGroups()
  ])
})

const getGroupName = (groupId: string) => {
  const group = groups.value.find(g => g.id === groupId)
  return group ? `${group.name} (${group.age_range})` : groupId
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

const deleteTimetable = async (id: string) => {
  if (!confirm('Are you sure you want to delete this timetable?')) return

  try {
    await timetableStore.deleteTimetable(id)
  } catch (e: any) {
    alert(e.message || 'Failed to delete timetable')
  }
}
</script>
