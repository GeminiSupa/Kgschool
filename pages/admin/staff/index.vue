<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <Heading size="xl">Staff Management</Heading>
      <NuxtLink
        to="/admin/staff/new"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        ➕ Add Staff Member
      </NuxtLink>
    </div>

    <div class="mb-4 flex gap-2">
      <button
        @click="selectedRole = ''"
        :class="[
          'px-4 py-2 rounded-md transition-colors',
          selectedRole === '' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        ]"
      >
        All
      </button>
      <button
        @click="selectedRole = 'teacher'"
        :class="[
          'px-4 py-2 rounded-md transition-colors',
          selectedRole === 'teacher' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        ]"
      >
        Teachers
      </button>
      <button
        @click="selectedRole = 'kitchen'"
        :class="[
          'px-4 py-2 rounded-md transition-colors',
          selectedRole === 'kitchen' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        ]"
      >
        Kitchen
      </button>
      <button
        @click="selectedRole = 'support'"
        :class="[
          'px-4 py-2 rounded-md transition-colors',
          selectedRole === 'support' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        ]"
      >
        Support
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <div v-if="filteredStaff.length === 0" class="p-8 text-center text-gray-500">
        No staff members found.
      </div>

      <table v-else class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Phone
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="member in filteredStaff" :key="member.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">
                {{ member.full_name }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ member.email }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                :class="[
                  'px-2 py-1 text-xs font-medium rounded-full capitalize',
                  member.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                  member.role === 'kitchen' ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-800'
                ]"
              >
                {{ member.role }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ member.phone || '-' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <NuxtLink
                :to="`/admin/staff/${member.id}`"
                class="text-blue-600 hover:text-blue-900"
              >
                View
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useStaffStore } from '~/stores/staff'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const staffStore = useStaffStore()
const { staff, loading, error } = storeToRefs(staffStore)
const selectedRole = ref('')

const filteredStaff = computed(() => {
  if (!selectedRole.value) return staff.value
  return staff.value.filter(s => s.role === selectedRole.value)
})

onMounted(async () => {
  await staffStore.fetchStaff()
})

watch(selectedRole, async (newRole) => {
  await staffStore.fetchStaff(newRole || undefined)
})
</script>
