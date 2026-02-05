<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <Heading size="xl">Applications & Waitlist</Heading>
      <NuxtLink
        to="/admin/applications/waitlist"
        class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
      >
        View Waitlist
      </NuxtLink>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else class="space-y-4">
      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-4 flex gap-4">
        <select
          v-model="statusFilter"
          @change="applyFilters"
          class="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="under_review">Under Review</option>
          <option value="offered">Offered</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="withdrawn">Withdrawn</option>
        </select>
      </div>

      <!-- Applications List -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Child</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kita</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="app in filteredApplications" :key="app.id">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  {{ app.child_first_name }} {{ app.child_last_name }}
                </div>
                <div class="text-sm text-gray-500">
                  DOB: {{ formatDate(app.child_date_of_birth) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ app.parent_name }}
                <div class="text-xs text-gray-500">{{ app.parent_email }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ getKitaName(app.kita_id) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatHoursType(app.betreuung_hours_type) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatDate(app.preferred_start_date) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="getStatusClass(app.status)">
                  {{ formatStatus(app.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <NuxtLink
                  :to="`/admin/applications/${app.id}`"
                  class="text-blue-600 hover:text-blue-900 mr-4"
                >
                  View
                </NuxtLink>
                <button
                  v-if="app.status === 'new' || app.status === 'under_review'"
                  @click="updateStatus(app.id, 'offered')"
                  class="text-green-600 hover:text-green-900 mr-4"
                >
                  Offer
                </button>
                <button
                  v-if="app.status === 'offered'"
                  @click="updateStatus(app.id, 'accepted')"
                  class="text-green-600 hover:text-green-900 mr-4"
                >
                  Accept
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApplicationsStore } from '~/stores/applications'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'
import type { Application } from '~/stores/applications'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const applicationsStore = useApplicationsStore()
const loading = ref(true)
const error = ref('')
const statusFilter = ref('')
const kitas = ref<Record<string, string>>({})

const filteredApplications = computed(() => {
  let apps = applicationsStore.applications
  if (statusFilter.value) {
    apps = apps.filter(a => a.status === statusFilter.value)
  }
  return apps
})

onMounted(async () => {
  try {
    await Promise.all([
      applicationsStore.fetchApplications(),
      loadKitas()
    ])
  } catch (e: any) {
    error.value = e.message || 'Failed to load applications'
  } finally {
    loading.value = false
  }
})

const loadKitas = async () => {
  try {
    const supabase = useSupabaseClient()
    const { data } = await supabase
      .from('kitas')
      .select('id, name')

    if (data) {
      data.forEach(kita => {
        kitas.value[kita.id] = kita.name
      })
    }
  } catch (e: any) {
    console.error('Error loading kitas:', e)
  }
}

const applyFilters = () => {
  // Filters applied via computed
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

const formatHoursType = (type: string) => {
  const types: Record<string, string> = {
    '25': '25h',
    '35': '35h',
    '45': '45h',
    'ganztag': 'Ganztag',
    'halbtag': 'Halbtag'
  }
  return types[type] || type
}

const formatStatus = (status: string) => {
  const statuses: Record<string, string> = {
    new: 'New',
    under_review: 'Under Review',
    offered: 'Offered',
    accepted: 'Accepted',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn'
  }
  return statuses[status] || status
}

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    new: 'px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800',
    under_review: 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800',
    offered: 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800',
    accepted: 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800',
    rejected: 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800',
    withdrawn: 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800'
  }
  return classes[status] || 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800'
}

const getKitaName = (kitaId: string) => {
  return kitas.value[kitaId] || kitaId
}

const updateStatus = async (applicationId: string, status: Application['status']) => {
  try {
    await applicationsStore.updateApplicationStatus(applicationId, status)
    await applicationsStore.fetchApplications()
    alert('Application status updated!')
  } catch (e: any) {
    alert(e.message || 'Failed to update status')
  }
}
</script>
