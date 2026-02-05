<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <Heading size="xl">Staff Qualifications</Heading>
      <button
        @click="showAddModal = true"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        + Add Qualification
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else class="space-y-4">
      <!-- Staff Filter -->
      <div class="bg-white rounded-lg shadow p-4">
        <label for="staff_filter" class="block text-sm font-medium text-gray-700 mb-2">
          Filter by Staff
        </label>
        <select
          id="staff_filter"
          v-model="selectedStaffId"
          @change="loadQualifications"
          class="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Staff</option>
          <option v-for="staff in staffList" :key="staff.id" :value="staff.id">
            {{ staff.full_name }}
          </option>
        </select>
      </div>

      <!-- Qualifications List -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qualification</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Certificate #</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issued</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="qual in qualifications" :key="qual.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ getStaffName(qual.staff_id) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatQualificationType(qual.qualification_type) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ qual.certificate_number || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ qual.issued_date ? formatDate(qual.issued_date) : '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span :class="getExpiryClass(qual.expiry_date)">
                  {{ qual.expiry_date ? formatDate(qual.expiry_date) : 'No expiry' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="getExpiryStatusClass(qual.expiry_date)">
                  {{ getExpiryStatus(qual.expiry_date) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  @click="editQualification(qual)"
                  class="text-blue-600 hover:text-blue-900 mr-4"
                >
                  Edit
                </button>
                <button
                  @click="deleteQualification(qual.id)"
                  class="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div
      v-if="showAddModal || editingQual"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <h3 class="text-xl font-bold mb-4">
            {{ editingQual ? 'Edit Qualification' : 'Add Qualification' }}
          </h3>

          <form @submit.prevent="handleSubmit" class="space-y-4">
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
              <label for="qualification_type" class="block text-sm font-medium text-gray-700 mb-2">
                Qualification Type <span class="text-red-500">*</span>
              </label>
              <select
                id="qualification_type"
                v-model="form.qualification_type"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="Erzieher">Erzieher</option>
                <option value="Kinderpfleger">Kinderpfleger</option>
                <option value="Heilpädagoge">Heilpädagoge</option>
                <option value="Fachkraft">Fachkraft</option>
                <option value="Praktikant">Praktikant</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="certificate_number" class="block text-sm font-medium text-gray-700 mb-2">
                  Certificate Number
                </label>
                <input
                  id="certificate_number"
                  v-model="form.certificate_number"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label for="issuing_authority" class="block text-sm font-medium text-gray-700 mb-2">
                  Issuing Authority
                </label>
                <input
                  id="issuing_authority"
                  v-model="form.issuing_authority"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="issued_date" class="block text-sm font-medium text-gray-700 mb-2">
                  Issued Date
                </label>
                <input
                  id="issued_date"
                  v-model="form.issued_date"
                  type="date"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label for="expiry_date" class="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date
                </label>
                <input
                  id="expiry_date"
                  v-model="form.expiry_date"
                  type="date"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
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
import type { StaffQualification } from '~/stores/staffManagement'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const staffManagementStore = useStaffManagementStore()
const loading = ref(true)
const error = ref('')
const selectedStaffId = ref('')
const showAddModal = ref(false)
const editingQual = ref<StaffQualification | null>(null)
const submitting = ref(false)
const staffList = ref<any[]>([])
const staffMap = ref<Record<string, string>>({})

const qualifications = computed(() => staffManagementStore.qualifications)

onMounted(async () => {
  await Promise.all([
    loadStaff(),
    loadQualifications()
  ])
})

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

const loadQualifications = async () => {
  loading.value = true
  try {
    await staffManagementStore.fetchQualifications(selectedStaffId.value || undefined)
  } catch (e: any) {
    error.value = e.message || 'Failed to load qualifications'
  } finally {
    loading.value = false
  }
}

const form = ref({
  staff_id: '',
  qualification_type: 'Erzieher' as StaffQualification['qualification_type'],
  certificate_number: '',
  issued_date: '',
  expiry_date: '',
  issuing_authority: '',
  notes: ''
})

const getStaffName = (staffId: string) => {
  return staffMap.value[staffId] || staffId
}

const formatQualificationType = (type: string) => {
  return type
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

const getExpiryClass = (expiryDate?: string) => {
  if (!expiryDate) return ''
  const expiry = new Date(expiryDate)
  const today = new Date()
  const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysUntilExpiry < 0) return 'text-red-600 font-semibold'
  if (daysUntilExpiry < 30) return 'text-yellow-600 font-semibold'
  return 'text-gray-500'
}

const getExpiryStatus = (expiryDate?: string) => {
  if (!expiryDate) return 'No expiry'
  const expiry = new Date(expiryDate)
  const today = new Date()
  const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysUntilExpiry < 0) return 'Expired'
  if (daysUntilExpiry < 30) return 'Expiring Soon'
  return 'Valid'
}

const getExpiryStatusClass = (expiryDate?: string) => {
  if (!expiryDate) return 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800'
  const expiry = new Date(expiryDate)
  const today = new Date()
  const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysUntilExpiry < 0) return 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800'
  if (daysUntilExpiry < 30) return 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800'
  return 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800'
}

const editQualification = (qual: StaffQualification) => {
  editingQual.value = qual
  form.value = {
    staff_id: qual.staff_id,
    qualification_type: qual.qualification_type,
    certificate_number: qual.certificate_number || '',
    issued_date: qual.issued_date || '',
    expiry_date: qual.expiry_date || '',
    issuing_authority: qual.issuing_authority || '',
    notes: qual.notes || ''
  }
}

const closeModal = () => {
  showAddModal.value = false
  editingQual.value = null
  form.value = {
    staff_id: '',
    qualification_type: 'Erzieher',
    certificate_number: '',
    issued_date: '',
    expiry_date: '',
    issuing_authority: '',
    notes: ''
  }
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    if (editingQual.value) {
      await staffManagementStore.updateQualification(editingQual.value.id, form.value)
    } else {
      await staffManagementStore.createQualification(form.value)
    }
    await loadQualifications()
    closeModal()
    alert('Qualification saved!')
  } catch (e: any) {
    alert(e.message || 'Failed to save qualification')
  } finally {
    submitting.value = false
  }
}

const deleteQualification = async (qualId: string) => {
  if (!confirm('Are you sure you want to delete this qualification?')) return

  try {
    await staffManagementStore.deleteQualification(qualId)
    await loadQualifications()
    alert('Qualification deleted!')
  } catch (e: any) {
    alert(e.message || 'Failed to delete qualification')
  }
}
</script>
