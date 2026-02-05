<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <div>
        <Heading size="xl" class="mb-1">Waitlist Management</Heading>
        <p class="text-sm text-gray-500">Manage waitlist positions and priorities</p>
      </div>
      <NuxtLink
        to="/admin/applications"
        class="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
      >
        ← Back to Applications
      </NuxtLink>
    </div>

    <!-- Filters -->
    <IOSCard customClass="mb-6 p-4">
      <div class="flex flex-wrap gap-4 items-center">
        <div class="flex-1 min-w-[200px]">
          <label class="block text-xs font-semibold text-gray-700 mb-1">Filter by Kita</label>
          <select
            v-model="kitaFilter"
            @change="applyFilters"
            class="w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Kitas</option>
            <option
              v-for="kita in kitas"
              :key="kita.id"
              :value="kita.id"
            >
              {{ kita.name }}
            </option>
          </select>
        </div>

        <div class="flex-1 min-w-[200px]">
          <label class="block text-xs font-semibold text-gray-700 mb-1">Filter by Group</label>
          <select
            v-model="groupFilter"
            @change="applyFilters"
            class="w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Groups</option>
            <option
              v-for="group in groups"
              :key="group.id"
              :value="group.id"
            >
              {{ group.name }}
            </option>
          </select>
        </div>

        <div class="flex items-end gap-2">
          <button
            @click="refreshWaitlist"
            :disabled="loading"
            class="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all"
          >
            {{ loading ? '⏳ Loading...' : '🔄 Refresh' }}
          </button>
        </div>
      </div>
    </IOSCard>

    <!-- Loading State -->
    <div v-if="loading && waitlistEntries.length === 0" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <!-- Waitlist Table -->
    <div v-else class="space-y-4">
      <IOSCard customClass="overflow-hidden p-0">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gradient-to-r from-blue-50 to-purple-50">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Position
                </th>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Child
                </th>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Parent
                </th>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Preferred Start
                </th>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Hours Type
                </th>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Priority Score
                </th>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Group
                </th>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="(entry, index) in filteredWaitlist"
                :key="entry.id"
                class="hover:bg-blue-50 transition-colors"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-sm">
                      {{ entry.position }}
                    </span>
                    <div class="flex flex-col gap-1">
                      <button
                        v-if="index > 0"
                        @click="movePosition(entry.id, 'up')"
                        class="text-xs text-blue-600 hover:text-blue-800"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        v-if="index < filteredWaitlist.length - 1"
                        @click="movePosition(entry.id, 'down')"
                        class="text-xs text-blue-600 hover:text-blue-800"
                        title="Move down"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">
                    {{ getApplication(entry.application_id)?.child_first_name }} {{ getApplication(entry.application_id)?.child_last_name }}
                  </div>
                  <div class="text-xs text-gray-500">
                    DOB: {{ formatDate(getApplication(entry.application_id)?.child_date_of_birth) }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">
                    {{ getApplication(entry.application_id)?.parent_name }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ getApplication(entry.application_id)?.parent_email }}
                  </div>
                  <div v-if="getApplication(entry.application_id)?.parent_phone" class="text-xs text-gray-500">
                    {{ getApplication(entry.application_id)?.parent_phone }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatDate(getApplication(entry.application_id)?.preferred_start_date) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {{ formatHoursType(getApplication(entry.application_id)?.betreuung_hours_type) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold text-gray-900">
                      {{ entry.priority_score }}
                    </span>
                    <button
                      @click="editPriority(entry)"
                      class="text-xs text-indigo-600 hover:text-indigo-800"
                      title="Edit priority"
                    >
                      ✏️
                    </button>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ getGroupName(entry.group_id) || 'Any Group' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex gap-2">
                    <NuxtLink
                      :to="`/admin/applications/${entry.application_id}`"
                      class="text-blue-600 hover:text-blue-900"
                      title="View Application"
                    >
                      👁️ View
                    </NuxtLink>
                    <button
                      @click="removeFromWaitlist(entry.id)"
                      class="text-red-600 hover:text-red-900"
                      title="Remove from waitlist"
                    >
                      🗑️ Remove
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-if="filteredWaitlist.length === 0" class="p-12 text-center">
          <div class="text-gray-400 text-6xl mb-4">📋</div>
          <p class="text-gray-600 font-medium">No waitlist entries found</p>
          <p class="text-sm text-gray-500 mt-2">
            Applications will appear here when they are added to the waitlist
          </p>
        </div>
      </IOSCard>

      <!-- Summary Stats -->
      <div v-if="filteredWaitlist.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <IOSCard customClass="p-4">
          <div class="text-sm text-gray-600 mb-1">Total Waitlist</div>
          <div class="text-2xl font-bold text-gray-900">{{ filteredWaitlist.length }}</div>
        </IOSCard>
        <IOSCard customClass="p-4">
          <div class="text-sm text-gray-600 mb-1">Average Priority</div>
          <div class="text-2xl font-bold text-gray-900">
            {{ averagePriority.toFixed(1) }}
          </div>
        </IOSCard>
        <IOSCard customClass="p-4">
          <div class="text-sm text-gray-600 mb-1">Next Available Position</div>
          <div class="text-2xl font-bold text-gray-900">
            #{{ nextPosition }}
          </div>
        </IOSCard>
      </div>
    </div>

    <!-- Edit Priority Modal -->
    <div
      v-if="showPriorityModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showPriorityModal = false"
    >
      <IOSCard customClass="max-w-md w-full mx-4 p-6">
        <Heading size="md" class="mb-4">Edit Priority Score</Heading>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Priority Score (higher = higher priority)
            </label>
            <input
              v-model.number="editingPriority"
              type="number"
              min="0"
              max="100"
              class="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p class="text-xs text-gray-500 mt-2">
              Priority score helps determine waitlist order. Higher scores appear first.
            </p>
          </div>
          <div class="flex justify-end gap-3">
            <button
              @click="showPriorityModal = false"
              class="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              @click="savePriority"
              class="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700"
            >
              Save
            </button>
          </div>
        </div>
      </IOSCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
import { useApplicationsStore } from '~/stores/applications'
import { useKita } from '~/composables/useKita'
import Heading from '~/components/ui/Heading.vue'
import IOSCard from '~/components/ui/IOSCard.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'
import type { WaitlistEntry, Application } from '~/stores/applications'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const supabase = useSupabaseClient()
const applicationsStore = useApplicationsStore()
const { getUserKitaId } = useKita()

const loading = ref(true)
const error = ref('')
const waitlistEntries = ref<WaitlistEntry[]>([])
const applications = ref<Application[]>([])
const kitas = ref<Array<{ id: string; name: string }>>([])
const groups = ref<Array<{ id: string; name: string }>>([])
const kitaFilter = ref('')
const groupFilter = ref('')
const showPriorityModal = ref(false)
const editingEntry = ref<WaitlistEntry | null>(null)
const editingPriority = ref(0)

const filteredWaitlist = computed(() => {
  let filtered = [...waitlistEntries.value]
  
  if (kitaFilter.value) {
    filtered = filtered.filter(e => e.kita_id === kitaFilter.value)
  }
  
  if (groupFilter.value) {
    filtered = filtered.filter(e => e.group_id === groupFilter.value)
  }
  
  // Sort by position
  return filtered.sort((a, b) => a.position - b.position)
})

const averagePriority = computed(() => {
  if (filteredWaitlist.value.length === 0) return 0
  const sum = filteredWaitlist.value.reduce((acc, e) => acc + e.priority_score, 0)
  return sum / filteredWaitlist.value.length
})

const nextPosition = computed(() => {
  if (filteredWaitlist.value.length === 0) return 1
  const maxPosition = Math.max(...filteredWaitlist.value.map(e => e.position))
  return maxPosition + 1
})

onMounted(async () => {
  await Promise.all([
    loadWaitlist(),
    loadApplications(),
    loadKitas(),
    loadGroups()
  ])
  loading.value = false
})

const loadWaitlist = async () => {
  try {
    const kitaId = await getUserKitaId()
    
    let query = supabase
      .from('waitlist')
      .select('*')
      .order('position', { ascending: true })

    if (kitaId) {
      query = query.eq('kita_id', kitaId)
    }

    const { data, error: err } = await query

    if (err) throw err
    waitlistEntries.value = data || []
  } catch (e: any) {
    console.error('Error loading waitlist:', e)
    error.value = e.message || 'Failed to load waitlist'
  }
}

const loadApplications = async () => {
  try {
    await applicationsStore.fetchApplications()
    applications.value = applicationsStore.applications
  } catch (e: any) {
    console.error('Error loading applications:', e)
  }
}

const loadKitas = async () => {
  try {
    const { data, error: err } = await supabase
      .from('kitas')
      .select('id, name')
      .order('name')

    if (err) throw err
    kitas.value = data || []
  } catch (e: any) {
    console.error('Error loading kitas:', e)
  }
}

const loadGroups = async () => {
  try {
    const kitaId = await getUserKitaId()
    
    let query = supabase
      .from('groups')
      .select('id, name')
      .order('name')

    if (kitaId) {
      query = query.eq('kita_id', kitaId)
    }

    const { data, error: err } = await query

    if (err) throw err
    groups.value = data || []
  } catch (e: any) {
    console.error('Error loading groups:', e)
  }
}

const refreshWaitlist = async () => {
  loading.value = true
  await loadWaitlist()
  loading.value = false
}

const applyFilters = () => {
  // Filters applied via computed
}

const getApplication = (applicationId: string): Application | undefined => {
  return applications.value.find(a => a.id === applicationId)
}

const getGroupName = (groupId?: string): string => {
  if (!groupId) return ''
  const group = groups.value.find(g => g.id === groupId)
  return group?.name || ''
}

const formatDate = (date?: string) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatHoursType = (type?: string) => {
  if (!type) return 'N/A'
  const types: Record<string, string> = {
    '25': '25h/Woche',
    '35': '35h/Woche',
    '45': '45h/Woche',
    'ganztag': 'Ganztag',
    'halbtag': 'Halbtag'
  }
  return types[type] || type
}

const movePosition = async (entryId: string, direction: 'up' | 'down') => {
  try {
    const entry = waitlistEntries.value.find(e => e.id === entryId)
    if (!entry) return

    const currentIndex = filteredWaitlist.value.findIndex(e => e.id === entryId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= filteredWaitlist.value.length) return

    const otherEntry = filteredWaitlist.value[newIndex]
    
    // Swap positions
    const tempPosition = entry.position
    entry.position = otherEntry.position
    otherEntry.position = tempPosition

    // Update in database
    await Promise.all([
      supabase
        .from('waitlist')
        .update({ position: entry.position })
        .eq('id', entry.id),
      supabase
        .from('waitlist')
        .update({ position: otherEntry.position })
        .eq('id', otherEntry.id)
    ])

    await loadWaitlist()
  } catch (e: any) {
    console.error('Error moving position:', e)
    error.value = e.message || 'Failed to move position'
  }
}

const editPriority = (entry: WaitlistEntry) => {
  editingEntry.value = entry
  editingPriority.value = entry.priority_score
  showPriorityModal.value = true
}

const savePriority = async () => {
  if (!editingEntry.value) return

  try {
    const { error: err } = await supabase
      .from('waitlist')
      .update({ priority_score: editingPriority.value })
      .eq('id', editingEntry.value.id)

    if (err) throw err

    editingEntry.value.priority_score = editingPriority.value
    showPriorityModal.value = false
    editingEntry.value = null
  } catch (e: any) {
    console.error('Error updating priority:', e)
    error.value = e.message || 'Failed to update priority'
  }
}

const removeFromWaitlist = async (entryId: string) => {
  if (!confirm('Are you sure you want to remove this entry from the waitlist?')) return

  try {
    const { error: err } = await supabase
      .from('waitlist')
      .delete()
      .eq('id', entryId)

    if (err) throw err

    await loadWaitlist()
  } catch (e: any) {
    console.error('Error removing from waitlist:', e)
    error.value = e.message || 'Failed to remove from waitlist'
  }
}
</script>
