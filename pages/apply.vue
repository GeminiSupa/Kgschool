<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <div class="bg-white shadow rounded-lg p-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Kita Application</h1>
        <p class="text-gray-600 mb-8">Please fill out the form below to apply for a place at our Kita</p>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Child Information -->
          <div class="border-b border-gray-200 pb-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Child Information</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="child_first_name" class="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span class="text-red-500">*</span>
                </label>
                <input
                  id="child_first_name"
                  v-model="form.child_first_name"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label for="child_last_name" class="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span class="text-red-500">*</span>
                </label>
                <input
                  id="child_last_name"
                  v-model="form.child_last_name"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label for="child_date_of_birth" class="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth <span class="text-red-500">*</span>
                </label>
                <input
                  id="child_date_of_birth"
                  v-model="form.child_date_of_birth"
                  type="date"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label for="preferred_start_date" class="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Start Date <span class="text-red-500">*</span>
                </label>
                <input
                  id="preferred_start_date"
                  v-model="form.preferred_start_date"
                  type="date"
                  required
                  :min="new Date().toISOString().split('T')[0]"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <!-- Care Hours -->
          <div class="border-b border-gray-200 pb-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Care Hours</h2>
            <div>
              <label for="betreuung_hours_type" class="block text-sm font-medium text-gray-700 mb-2">
                Betreuungsumfang <span class="text-red-500">*</span>
              </label>
              <select
                id="betreuung_hours_type"
                v-model="form.betreuung_hours_type"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                <option value="25">25 Stunden/Woche</option>
                <option value="35">35 Stunden/Woche</option>
                <option value="45">45 Stunden/Woche</option>
                <option value="ganztag">Ganztag</option>
                <option value="halbtag">Halbtag</option>
              </select>
            </div>
          </div>

          <!-- Parent Information -->
          <div class="border-b border-gray-200 pb-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Parent/Guardian Information</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="parent_name" class="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span class="text-red-500">*</span>
                </label>
                <input
                  id="parent_name"
                  v-model="form.parent_name"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label for="parent_email" class="block text-sm font-medium text-gray-700 mb-2">
                  Email <span class="text-red-500">*</span>
                </label>
                <input
                  id="parent_email"
                  v-model="form.parent_email"
                  type="email"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label for="parent_phone" class="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  id="parent_phone"
                  v-model="form.parent_phone"
                  type="tel"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <!-- Kita Selection -->
          <div class="border-b border-gray-200 pb-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Kita Selection</h2>
            <div>
              <label for="kita_id" class="block text-sm font-medium text-gray-700 mb-2">
                Preferred Kita <span class="text-red-500">*</span>
              </label>
              <select
                id="kita_id"
                v-model="form.kita_id"
                required
                :disabled="kitasLoading"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">{{ kitasLoading ? 'Loading...' : 'Select Kita...' }}</option>
                <option v-for="kita in kitas" :key="kita.id" :value="kita.id">
                  {{ kita.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- Additional Notes -->
          <div>
            <label for="notes" class="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              id="notes"
              v-model="form.notes"
              rows="4"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Any additional information you'd like to provide..."
            />
          </div>

          <div v-if="submitError" class="p-4 bg-red-50 text-red-700 rounded-md">
            {{ submitError }}
          </div>

          <div v-if="submitSuccess" class="p-4 bg-green-50 text-green-700 rounded-md">
            Application submitted successfully! We will contact you soon.
          </div>

          <div class="flex justify-end gap-4 pt-6">
            <button
              type="submit"
              :disabled="loading"
              class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {{ loading ? 'Submitting...' : 'Submit Application' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useApplicationsStore } from '~/stores/applications'

definePageMeta({
  middleware: []
})

const applicationsStore = useApplicationsStore()
const loading = ref(false)
const submitError = ref('')
const submitSuccess = ref(false)
const kitas = ref<any[]>([])
const kitasLoading = ref(true)

const form = ref({
  kita_id: '',
  child_first_name: '',
  child_last_name: '',
  child_date_of_birth: '',
  preferred_start_date: '',
  betreuung_hours_type: '' as '25' | '35' | '45' | 'ganztag' | 'halbtag' | '',
  parent_name: '',
  parent_email: '',
  parent_phone: '',
  notes: ''
})

onMounted(async () => {
  await loadKitas()
})

const loadKitas = async () => {
  try {
    const supabase = useSupabaseClient()
    const { data, error } = await supabase
      .from('kitas')
      .select('id, name')
      .order('name')

    if (error) throw error
    kitas.value = data || []
  } catch (e: any) {
    console.error('Error loading kitas:', e)
  } finally {
    kitasLoading.value = false
  }
}

const handleSubmit = async () => {
  if (!form.value.kita_id) {
    submitError.value = 'Please select a Kita'
    return
  }

  loading.value = true
  submitError.value = ''
  submitSuccess.value = false

  try {
    await applicationsStore.createApplication({
      ...form.value,
      status: 'new'
    })

    submitSuccess.value = true
    // Reset form
    form.value = {
      kita_id: '',
      child_first_name: '',
      child_last_name: '',
      child_date_of_birth: '',
      preferred_start_date: '',
      betreuung_hours_type: '' as any,
      parent_name: '',
      parent_email: '',
      parent_phone: '',
      notes: ''
    }
  } catch (e: any) {
    submitError.value = e.message || 'Failed to submit application'
  } finally {
    loading.value = false
  }
}
</script>
