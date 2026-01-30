<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/admin/hr/payroll"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Payroll
      </NuxtLink>
      <Heading size="xl">Payroll Details</Heading>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else-if="payrollRecord" class="space-y-6">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-600">Staff Member</label>
            <p class="mt-1 text-gray-900">{{ getStaffName(payrollRecord.staff_id) }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600">Period</label>
            <p class="mt-1 text-gray-900">{{ getMonthName(payrollRecord.month) }} {{ payrollRecord.year }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-600">Base Salary</label>
            <p class="mt-1 text-gray-900">€{{ payrollRecord.base_salary.toFixed(2) }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600">Overtime Amount</label>
            <p class="mt-1 text-gray-900">€{{ payrollRecord.overtime_amount.toFixed(2) }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-600">Bonuses</label>
            <p class="mt-1 text-green-600">€{{ payrollRecord.bonuses.toFixed(2) }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600">Deductions</label>
            <p class="mt-1 text-red-600">€{{ payrollRecord.deductions.toFixed(2) }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-600">Tax Amount</label>
            <p class="mt-1 text-gray-900">€{{ payrollRecord.tax_amount.toFixed(2) }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600">Net Salary</label>
            <p class="mt-1 text-lg font-bold text-gray-900">€{{ payrollRecord.net_salary.toFixed(2) }}</p>
          </div>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-600">Status</label>
          <span
            :class="[
              'inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full',
              payrollRecord.status === 'paid' ? 'bg-green-100 text-green-800' :
              payrollRecord.status === 'approved' ? 'bg-blue-100 text-blue-800' :
              'bg-yellow-100 text-yellow-800'
            ]"
          >
            {{ payrollRecord.status }}
          </span>
        </div>

        <div v-if="payrollRecord.notes" class="mb-4">
          <label class="block text-sm font-medium text-gray-600">Notes</label>
          <p class="mt-1 text-gray-900">{{ payrollRecord.notes }}</p>
        </div>

        <div v-if="payrollRecord.paid_at" class="mb-4">
          <label class="block text-sm font-medium text-gray-600">Paid At</label>
          <p class="mt-1 text-gray-900">{{ formatDateTime(payrollRecord.paid_at) }}</p>
        </div>

        <div v-if="payrollRecord.status !== 'paid'" class="pt-4 border-t">
          <button
            @click="editPayroll"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mr-2"
          >
            Edit
          </button>
          <button
            @click="markAsPaid"
            class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Mark as Paid
          </button>
        </div>
      </div>

      <div v-if="showEditForm" class="bg-white rounded-lg shadow p-6">
        <Heading size="md" class="mb-4">Edit Payroll</Heading>
        <PayrollForm
          :staff-id="payrollRecord.staff_id"
          :initial-data="payrollRecord"
          @submit="handleUpdate"
          @cancel="showEditForm = false"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSupabaseClient } from '#imports'
import { usePayrollStore } from '~/stores/payroll'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'
import PayrollForm from '~/components/forms/PayrollForm.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()
const payrollStore = usePayrollStore()

const payrollId = route.params.id as string
const loading = ref(true)
const error = ref('')
const payrollRecord = ref<any>(null)
const staff = ref<any[]>([])
const showEditForm = ref(false)

onMounted(async () => {
  try {
    await Promise.all([
      fetchPayroll(),
      fetchStaff()
    ])
  } catch (e: any) {
    error.value = e.message || 'Failed to load payroll'
  } finally {
    loading.value = false
  }
})

const fetchPayroll = async () => {
  try {
    await payrollStore.fetchPayroll()
    const found = payrollStore.payroll.find(p => p.id === payrollId)
    if (!found) {
      error.value = 'Payroll record not found'
      return
    }
    payrollRecord.value = found
  } catch (e: any) {
    error.value = e.message || 'Failed to load payroll'
  }
}

const fetchStaff = async () => {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('role', ['teacher', 'support', 'kitchen'])
      .order('full_name')

    staff.value = data || []
  } catch (e: any) {
    console.error('Error fetching staff:', e)
  }
}

const getStaffName = (staffId: string) => {
  const s = staff.value.find(s => s.id === staffId)
  return s?.full_name || staffId
}

const getMonthName = (month: number) => {
  const date = new Date(2000, month - 1, 1)
  return date.toLocaleString('default', { month: 'long' })
}

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString()
}

const editPayroll = () => {
  showEditForm.value = true
}

const handleUpdate = async (data: any) => {
  try {
    await payrollStore.updatePayroll(payrollId, data)
    alert('Payroll updated successfully!')
    showEditForm.value = false
    await fetchPayroll()
  } catch (e: any) {
    alert(e.message || 'Failed to update payroll')
  }
}

const markAsPaid = async () => {
  if (!confirm('Mark this payroll as paid?')) return

  try {
    await payrollStore.markAsPaid(payrollId)
    await fetchPayroll()
    alert('Payroll marked as paid!')
  } catch (e: any) {
    alert(e.message || 'Failed to mark as paid')
  }
}
</script>
