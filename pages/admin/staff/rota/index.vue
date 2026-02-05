<template>
  <div>
    <div class="mb-6">
      <Heading size="xl">Staff Rota (Daily Assignments)</Heading>
      <p class="text-gray-600 mt-2">Manage daily staff assignments and absences</p>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else class="space-y-6">
      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-4 flex gap-4">
        <div>
          <label for="group_filter" class="block text-xs text-gray-500 mb-1">Group</label>
          <select
            id="group_filter"
            v-model="selectedGroupId"
            @change="loadRota"
            class="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">All Groups</option>
            <option v-for="group in groups" :key="group.id" :value="group.id">
              {{ group.name }}
            </option>
          </select>
        </div>
        <div>
          <label for="date_filter" class="block text-xs text-gray-500 mb-1">Date</label>
          <input
            id="date_filter"
            v-model="selectedDate"
            type="date"
            @change="loadRota"
            class="px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label for="date_range_start" class="block text-xs text-gray-500 mb-1">Start Date</label>
          <input
            id="date_range_start"
            v-model="dateRangeStart"
            type="date"
            @change="loadRota"
            class="px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label for="date_range_end" class="block text-xs text-gray-500 mb-1">End Date</label>
          <input
            id="date_range_end"
            v-model="dateRangeEnd"
            type="date"
            @change="loadRota"
            class="px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div class="flex items-end">
          <button
            @click="showAddModal = true"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + Add Assignment
          </button>
        </div>
      </div>

      <!-- Rota Calendar View -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Replacement</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="entry in rota" :key="entry.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatDate(entry.date) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ getGroupName(entry.group_id) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ getStaffName(entry.staff_id) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span v-if="entry.start_time && entry.end_time">
                  {{ formatTime(entry.start_time) }} - {{ formatTime(entry.end_time) }}
                </span>
                <span v-else>-</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span v-if="entry.is_absence" :class="getAbsenceClass(entry.absence_type)">
                  {{ formatAbsenceType(entry.absence_type) }}
                </span>
                <span v-else class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  Present
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ entry.replacement_staff_id ? getStaffName(entry.replacement_staff_id) : '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  @click="editRotaEntry(entry)"
                  class="text-blue-600 hover:text-blue-900 mr-4"
                >
                  Edit
                </button>
                <button
                  @click="deleteRotaEntry(entry.id)"
                  class="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="rota.length === 0" class="text-center py-12 text-gray-500">
          No rota entries found
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div
      v-if="showAddModal || editingEntry"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div class="p-6">
          <h3 class="text-xl font-bold mb-4">
            {{ editingEntry ? 'Edit Rota Entry' : 'Add Rota Entry' }}
          </h3>

          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="staff_id" class="block text-sm font-medium text-gray-700 mb-2">
                  Staff <span class="text-red-500">*</span>
                </label>
                <select
                  id="staff_id"
                  v-model="form.staff_id"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select staff...</option>
                  <option v-for="staff in staffList" :key="staff.id" :value="staff.id">
                    {{ staff.full_name }}
                  </option>
                </select>
              </div>
              <div>
                <label for="group_id" class="block text-sm font-medium text-gray-700 mb-2">
                  Group <span class="text-red-500">*</span>
                </label>
                <select
                  id="group_id"
                  v-model="form.group_id"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select group...</option>
                  <option v-for="group in groups" :key="group.id" :value="group.id">
                    {{ group.name }}
                  </option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-4">
              <div>
                <label for="date" class="block text-sm font-medium text-gray-700 mb-2">
                  Date <span class="text-red-500">*</span>
                </label>
                <input
                  id="date"
                  v-model="form.date"
                  type="date"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label for="start_time" class="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  id="start_time"
                  v-model="form.start_time"
                  type="time"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label for="end_time" class="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  id="end_time"
                  v-model="form.end_time"
                  type="time"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="form.is_absence"
                  class="mr-2"
                />
                <span class="text-sm font-medium text-gray-700">Mark as Absence</span>
              </label>
            </div>

            <div v-if="form.is_absence" class="grid grid-cols-2 gap-4">
              <div>
                <label for="absence_type" class="block text-sm font-medium text-gray-700 mb-2">
                  Absence Type
                </label>
                <select
                  id="absence_type"
                  v-model="form.absence_type"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="sick">Sick</option>
                  <option value="vacation">Vacation</option>
                  <option value="training">Training</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label for="replacement_staff_id" class="block text-sm font-medium text-gray-700 mb-2">
                  Replacement Staff
                </label>
                <select
                  id="replacement_staff_id"
                  v-model="form.replacement_staff_id"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">None</option>
                  <option v-for="staff in staffList" :key="staff.id" :value="staff.id">
                    {{ staff.full_name }}
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label for="notes" class="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                v-model="form.notes"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div class="flex justify-end gap-3 pt-4">
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="submitting"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {{ submitting ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
import { useStaffManagementStore } from '~/stores/staffManagement'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'
import type { StaffRota } from '~/stores/staffManagement'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const staffManagementStore = useStaffManagementStore()
const loading = ref(true)
const error = ref('')
const selectedGroupId = ref('')
const selectedDate = ref('')
const dateRangeStart = ref('')
const dateRangeEnd = ref('')
const showAddModal = ref(false)
const editingEntry = ref<StaffRota | null>(null)
const submitting = ref(false)
const groups = ref<any[]>([])
const staffList = ref<any[]>([])
const groupsMap = ref<Record<string, string>>({})
const staffMap = ref<Record<string, string>>({})

const rota = computed(() => staffManagementStore.rota)

onMounted(async () => {
  await Promise.all([
    loadGroups(),
    loadStaff(),
    loadRota()
  ])
})

const loadGroups = async () => {
  try {
    const supabase = useSupabaseClient()
    const { data } = await supabase
      .from('groups')
      .select('id, name')
      .order('name')

    groups.value = data || []
    data?.forEach(group => {
      groupsMap.value[group.id] = group.name
    })
  } catch (e: any) {
    console.error('Error loading groups:', e)
  }
}

const loadStaff = async () => {
  try {
    const supabase = useSupabaseClient()
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('role', ['teacher', 'support'])
      .order('full_name')

    staffList.value = data || []
    data?.forEach(staff => {
      staffMap.value[staff.id] = staff.full_name
    })
  } catch (e: any) {
    console.error('Error loading staff:', e)
  }
}

const loadRota = async () => {
  loading.value = true
  try {
    await staffManagementStore.fetchRota(
      selectedGroupId.value || undefined,
      selectedDate.value || undefined,
      dateRangeStart.value || undefined,
      dateRangeEnd.value || undefined
    )
  } catch (e: any) {
    error.value = e.message || 'Failed to load rota'
  } finally {
    loading.value = false
  }
}

const form = ref({
  staff_id: '',
  group_id: '',
  date: new Date().toISOString().split('T')[0],
  start_time: '',
  end_time: '',
  is_absence: false,
  absence_type: 'sick' as 'sick' | 'vacation' | 'training' | 'other' | undefined,
  replacement_staff_id: '',
  notes: ''
})

const getGroupName = (groupId: string) => {
  return groupsMap.value[groupId] || groupId
}

const getStaffName = (staffId: string) => {
  return staffMap.value[staffId] || staffId
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

const formatTime = (time: string) => {
  return time.substring(0, 5) // HH:MM
}

const formatAbsenceType = (type?: string) => {
  const types: Record<string, string> = {
    sick: 'Sick',
    vacation: 'Vacation',
    training: 'Training',
    other: 'Other'
  }
  return types[type || ''] || 'Absence'
}

const getAbsenceClass = (type?: string) => {
  const classes: Record<string, string> = {
    sick: 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800',
    vacation: 'px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800',
    training: 'px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800',
    other: 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800'
  }
  return classes[type || ''] || 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800'
}

const editRotaEntry = (entry: StaffRota) => {
  editingEntry.value = entry
  form.value = {
    staff_id: entry.staff_id,
    group_id: entry.group_id,
    date: entry.date,
    start_time: entry.start_time || '',
    end_time: entry.end_time || '',
    is_absence: entry.is_absence,
    absence_type: entry.absence_type,
    replacement_staff_id: entry.replacement_staff_id || '',
    notes: entry.notes || ''
  }
}

const closeModal = () => {
  showAddModal.value = false
  editingEntry.value = null
  form.value = {
    staff_id: '',
    group_id: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    is_absence: false,
    absence_type: 'sick',
    replacement_staff_id: '',
    notes: ''
  }
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    const rotaData: any = {
      ...form.value,
      is_absence: form.value.is_absence || false
    }

    if (!rotaData.start_time) delete rotaData.start_time
    if (!rotaData.end_time) delete rotaData.end_time
    if (!rotaData.absence_type) delete rotaData.absence_type
    if (!rotaData.replacement_staff_id) delete rotaData.replacement_staff_id
    if (!rotaData.notes) delete rotaData.notes

    if (editingEntry.value) {
      await staffManagementStore.updateRotaEntry(editingEntry.value.id, rotaData)
    } else {
      await staffManagementStore.createRotaEntry(rotaData)
    }
    await loadRota()
    closeModal()
    alert('Rota entry saved!')
  } catch (e: any) {
    alert(e.message || 'Failed to save rota entry')
  } finally {
    submitting.value = false
  }
}

const deleteRotaEntry = async (rotaId: string) => {
  if (!confirm('Are you sure you want to delete this rota entry?')) return

  try {
    // Note: deleteRotaEntry method needs to be added to store
    const supabase = useSupabaseClient()
    const { error } = await supabase
      .from('staff_rota')
      .delete()
      .eq('id', rotaId)

    if (error) throw error
    await loadRota()
    alert('Rota entry deleted!')
  } catch (e: any) {
    alert(e.message || 'Failed to delete rota entry')
  }
}
</script>
