<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/admin/hr/salary-config"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Salary Config
      </NuxtLink>
      <Heading size="xl">Create Salary Configuration</Heading>
    </div>

    <div class="bg-white rounded-lg shadow p-6 max-w-2xl">
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="staff_id" class="block text-sm font-medium text-gray-700 mb-2">
            Staff Member <span class="text-red-500">*</span>
          </label>
          <select
            id="staff_id"
            v-model="form.staff_id"
            required
            :disabled="staffLoading"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">{{ staffLoading ? 'Loading...' : 'Select staff member' }}</option>
            <option v-for="s in staff" :key="s.id" :value="s.id">
              {{ s.full_name }} ({{ s.role }})
            </option>
          </select>
        </div>

        <SalaryConfigForm
          :staff-id="form.staff_id"
          @submit="handleFormSubmit"
          @cancel="handleCancel"
        />
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSupabaseClient } from '#imports'
import { useSalaryConfigStore } from '~/stores/salaryConfig'
import Heading from '~/components/ui/Heading.vue'
import SalaryConfigForm from '~/components/forms/SalaryConfigForm.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const router = useRouter()
const supabase = useSupabaseClient()
const salaryConfigStore = useSalaryConfigStore()

const staff = ref<any[]>([])
const staffLoading = ref(true)
const form = ref({
  staff_id: ''
})

onMounted(async () => {
  try {
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .in('role', ['teacher', 'support', 'kitchen'])
      .order('full_name')

    if (fetchError) throw fetchError
    staff.value = data || []
  } catch (e: any) {
    console.error('Error fetching staff:', e)
  } finally {
    staffLoading.value = false
  }
})

const handleFormSubmit = async (data: any) => {
  try {
    await salaryConfigStore.createConfig({
      ...data,
      staff_id: form.value.staff_id
    })
    alert('Salary configuration created successfully!')
    router.push('/admin/hr/salary-config')
  } catch (error: any) {
    alert(error.message || 'Failed to create configuration')
  }
}

const handleSubmit = () => {
  // Form submission is handled by SalaryConfigForm
}

const handleCancel = () => {
  router.push('/admin/hr/salary-config')
}
</script>
