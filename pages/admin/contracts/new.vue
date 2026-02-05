<template>
  <div>
    <div class="mb-6">
      <Heading size="xl" class="mb-1">New Contract</Heading>
      <p class="text-sm text-gray-500">Create a new care contract for a child</p>
    </div>

    <IOSCard customClass="max-w-4xl p-6">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Child Selection -->
        <div>
          <label for="child_id" class="block text-sm font-semibold text-gray-700 mb-2">
            Child <span class="text-red-500">*</span>
          </label>
          <select
            id="child_id"
            v-model="form.child_id"
            required
            @change="onChildChange"
            class="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="">Select a child...</option>
            <option
              v-for="child in availableChildren"
              :key="child.id"
              :value="child.id"
            >
              {{ child.first_name }} {{ child.last_name }} ({{ child.group_name || 'No group' }})
            </option>
          </select>
          <p v-if="!form.child_id" class="text-xs text-gray-500 mt-2">
            Select the child for this contract
          </p>
        </div>

        <!-- Contract Dates -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label for="start_date" class="block text-sm font-semibold text-gray-700 mb-2">
              Start Date <span class="text-red-500">*</span>
            </label>
            <input
              id="start_date"
              v-model="form.start_date"
              type="date"
              required
              class="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label for="end_date" class="block text-sm font-semibold text-gray-700 mb-2">
              End Date (Optional)
            </label>
            <input
              id="end_date"
              v-model="form.end_date"
              type="date"
              :min="form.start_date"
              class="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            <p class="text-xs text-gray-500 mt-2">Leave empty for ongoing contract</p>
          </div>
        </div>

        <!-- Contract Number -->
        <div>
          <label for="contract_number" class="block text-sm font-semibold text-gray-700 mb-2">
            Contract Number (Optional)
          </label>
          <input
            id="contract_number"
            v-model="form.contract_number"
            type="text"
            class="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            placeholder="e.g., VERT-2024-001"
          />
          <p class="text-xs text-gray-500 mt-2">Auto-generated if left empty</p>
        </div>

        <!-- Betreuungsumfang -->
        <div>
          <label for="betreuung_hours_type" class="block text-sm font-semibold text-gray-700 mb-2">
            Betreuungsumfang (Care Hours) <span class="text-red-500">*</span>
          </label>
          <select
            id="betreuung_hours_type"
            v-model="form.betreuung_hours_type"
            required
            class="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="">Select care hours...</option>
            <option value="25">25 Stunden/Woche</option>
            <option value="35">35 Stunden/Woche</option>
            <option value="45">45 Stunden/Woche</option>
            <option value="ganztag">Ganztag</option>
            <option value="halbtag">Halbtag</option>
          </select>
        </div>

        <!-- Fee Category & Subsidies -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label for="fee_category" class="block text-sm font-semibold text-gray-700 mb-2">
              Fee Category <span class="text-red-500">*</span>
            </label>
            <select
              id="fee_category"
              v-model="form.fee_category"
              required
              class="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="">Select category...</option>
              <option value="standard">Standard</option>
              <option value="reduced">Reduced</option>
              <option value="waived">Waived</option>
              <option value="subsidized">Subsidized</option>
            </select>
          </div>

          <div>
            <label for="subsidy_type" class="block text-sm font-semibold text-gray-700 mb-2">
              Subsidy Type (Optional)
            </label>
            <select
              id="subsidy_type"
              v-model="form.subsidy_type"
              class="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="">No subsidy</option>
              <option value="BuT">BuT (Bildungs- und Teilhabepaket)</option>
              <option value="BremenPass">Bremen Pass</option>
              <option value="Geschwisterrabatt">Geschwisterrabatt</option>
              <option value="Landeszuschuss">Landeszuschuss</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div v-if="form.subsidy_type" class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label for="subsidy_amount" class="block text-sm font-semibold text-gray-700 mb-2">
              Subsidy Amount (€)
            </label>
            <input
              id="subsidy_amount"
              v-model.number="form.subsidy_amount"
              type="number"
              step="0.01"
              min="0"
              class="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="0.00"
            />
          </div>
        </div>

        <!-- Lunch Settings -->
        <div class="p-5 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-blue-100">
          <Heading size="md" class="mb-4">Lunch Settings</Heading>
          
          <div class="space-y-4">
            <div class="flex items-center gap-3 p-4 bg-white rounded-xl">
              <input
                id="lunch_obligation"
                v-model="form.lunch_obligation"
                type="checkbox"
                class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <label for="lunch_obligation" class="text-sm font-medium text-gray-700 cursor-pointer">
                Lunch Obligation (Child must have lunch)
              </label>
            </div>

            <div>
              <label for="lunch_billing_type" class="block text-sm font-semibold text-gray-700 mb-2">
                Lunch Billing Type <span class="text-red-500">*</span>
              </label>
              <select
                id="lunch_billing_type"
                v-model="form.lunch_billing_type"
                required
                @change="onBillingTypeChange"
                class="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="per_meal">Per Meal</option>
                <option value="flat_monthly">Flat Monthly Rate</option>
                <option value="hybrid">Hybrid (Flat + Per Meal)</option>
              </select>
            </div>

            <div v-if="form.lunch_billing_type === 'flat_monthly' || form.lunch_billing_type === 'hybrid'">
              <label for="lunch_flat_rate_amount" class="block text-sm font-semibold text-gray-700 mb-2">
                Monthly Flat Rate (€) <span class="text-red-500">*</span>
              </label>
              <input
                id="lunch_flat_rate_amount"
                v-model.number="form.lunch_flat_rate_amount"
                type="number"
                step="0.01"
                min="0"
                required
                class="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="66.00"
              />
              <p class="text-xs text-gray-500 mt-2">Fixed monthly amount for lunch</p>
            </div>
          </div>
        </div>

        <!-- Status -->
        <div>
          <label for="status" class="block text-sm font-semibold text-gray-700 mb-2">
            Status <span class="text-red-500">*</span>
          </label>
          <select
            id="status"
            v-model="form.status"
            required
            class="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>

        <!-- Notes -->
        <div>
          <label for="notes" class="block text-sm font-semibold text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            v-model="form.notes"
            rows="4"
            class="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
            placeholder="Additional notes about this contract..."
          />
        </div>

        <!-- Error Message -->
        <div v-if="error" class="p-4 bg-red-50 border-2 border-red-200 text-red-800 rounded-xl text-sm">
          ⚠️ {{ error }}
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <NuxtLink
            to="/admin/contracts"
            class="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
          >
            Cancel
          </NuxtLink>
          <button
            type="submit"
            :disabled="submitting"
            class="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
          >
            {{ submitting ? '⏳ Creating...' : '✅ Create Contract' }}
          </button>
        </div>
      </form>
    </IOSCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSupabaseClient } from '#imports'
import { useContractsStore } from '~/stores/contracts'
import { useKita } from '~/composables/useKita'
import Heading from '~/components/ui/Heading.vue'
import IOSCard from '~/components/ui/IOSCard.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const router = useRouter()
const supabase = useSupabaseClient()
const contractsStore = useContractsStore()
const { getUserKitaId } = useKita()

const submitting = ref(false)
const error = ref('')
const availableChildren = ref<any[]>([])

const form = ref({
  child_id: '',
  start_date: new Date().toISOString().split('T')[0],
  end_date: '',
  contract_number: '',
  betreuung_hours_type: '' as '25' | '35' | '45' | 'ganztag' | 'halbtag' | '',
  fee_category: 'standard' as 'standard' | 'reduced' | 'waived' | 'subsidized',
  lunch_obligation: true,
  lunch_billing_type: 'per_meal' as 'flat_monthly' | 'per_meal' | 'hybrid',
  lunch_flat_rate_amount: undefined as number | undefined,
  subsidy_type: '' as 'BuT' | 'BremenPass' | 'Geschwisterrabatt' | 'Landeszuschuss' | 'other' | '',
  subsidy_amount: 0,
  notes: '',
  status: 'pending' as 'active' | 'suspended' | 'terminated' | 'pending'
})

onMounted(async () => {
  await loadChildren()
})

const loadChildren = async () => {
  try {
    const kitaId = await getUserKitaId()
    
    // Load children
    let query = supabase
      .from('children')
      .select('id, first_name, last_name, group_id')
      .eq('status', 'active')
      .order('first_name')

    if (kitaId) {
      query = query.eq('kita_id', kitaId)
    }

    const { data: childrenData, error: childrenError } = await query

    if (childrenError) throw childrenError

    // Load groups separately
    const groupIds = [...new Set((childrenData || []).map((c: any) => c.group_id).filter(Boolean))]
    const groupsMap: Record<string, string> = {}

    if (groupIds.length > 0) {
      const { data: groupsData } = await supabase
        .from('groups')
        .select('id, name')
        .in('id', groupIds)

      if (groupsData) {
        groupsData.forEach((g: any) => {
          groupsMap[g.id] = g.name
        })
      }
    }

    availableChildren.value = (childrenData || []).map((child: any) => ({
      id: child.id,
      first_name: child.first_name,
      last_name: child.last_name,
      group_id: child.group_id,
      group_name: child.group_id ? groupsMap[child.group_id] || null : null
    }))
  } catch (e: any) {
    console.error('Error loading children:', e)
    error.value = e.message || 'Failed to load children'
  }
}

const onChildChange = () => {
  // Could auto-fill some fields based on child's existing contract
}

const onBillingTypeChange = () => {
  // Reset flat rate if switching away from flat/hybrid
  if (form.value.lunch_billing_type === 'per_meal') {
    form.value.lunch_flat_rate_amount = undefined
  } else if (!form.value.lunch_flat_rate_amount) {
    form.value.lunch_flat_rate_amount = 66.00 // Default flat rate
  }
}

const handleSubmit = async () => {
  submitting.value = true
  error.value = ''

  try {
    // Validate required fields
    if (!form.value.child_id) {
      error.value = 'Please select a child'
      submitting.value = false
      return
    }

    if (!form.value.betreuung_hours_type) {
      error.value = 'Please select care hours type'
      submitting.value = false
      return
    }

    if ((form.value.lunch_billing_type === 'flat_monthly' || form.value.lunch_billing_type === 'hybrid') && !form.value.lunch_flat_rate_amount) {
      error.value = 'Please enter a monthly flat rate amount'
      submitting.value = false
      return
    }

    // Get kita_id
    const kitaId = await getUserKitaId()
    if (!kitaId) {
      // For single-Kita setup, try to get from child's group
      const child = availableChildren.value.find(c => c.id === form.value.child_id)
      if (child?.group_id) {
        const { data: groupData } = await supabase
          .from('groups')
          .select('kita_id')
          .eq('id', child.group_id)
          .single()
        
        if (groupData?.kita_id) {
          // Use child's group kita_id
        }
      }
    }

    // Generate contract number if not provided
    let contractNumber = form.value.contract_number
    if (!contractNumber) {
      const year = new Date().getFullYear()
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      contractNumber = `VERT-${year}-${random}`
    }

    // Prepare contract data
    const contractData: any = {
      child_id: form.value.child_id,
      start_date: form.value.start_date,
      end_date: form.value.end_date || null,
      contract_number: contractNumber,
      betreuung_hours_type: form.value.betreuung_hours_type,
      fee_category: form.value.fee_category,
      lunch_obligation: form.value.lunch_obligation,
      lunch_billing_type: form.value.lunch_billing_type,
      lunch_flat_rate_amount: form.value.lunch_flat_rate_amount || null,
      subsidy_type: form.value.subsidy_type || null,
      subsidy_amount: form.value.subsidy_amount || 0,
      notes: form.value.notes || null,
      status: form.value.status
    }

    // Add kita_id if available (optional for single-Kita)
    if (kitaId) {
      contractData.kita_id = kitaId
    } else {
      // Try to get from child's group
      const child = availableChildren.value.find(c => c.id === form.value.child_id)
      if (child?.group_id) {
        const { data: groupData } = await supabase
          .from('groups')
          .select('kita_id')
          .eq('id', child.group_id)
          .single()
        
        if (groupData?.kita_id) {
          contractData.kita_id = groupData.kita_id
        }
      }
    }

    // Create contract
    const { data, error: err } = await supabase
      .from('child_contracts')
      .insert([contractData])
      .select()
      .single()

    if (err) {
      // If kita_id is required but missing, try without it for single-Kita
      if (err.message?.includes('kita_id') && !contractData.kita_id) {
        // For single-Kita, kita_id might be optional
        // Try creating without it (if schema allows)
        console.warn('kita_id not found, attempting without it for single-Kita setup')
        delete contractData.kita_id
        
        const { data: retryData, error: retryError } = await supabase
          .from('child_contracts')
          .insert([contractData])
          .select()
          .single()
        
        if (retryError) throw retryError
        await router.push(`/admin/contracts/${retryData.id}`)
        return
      }
      throw err
    }

    await router.push(`/admin/contracts/${data.id}`)
  } catch (e: any) {
    console.error('Error creating contract:', e)
    error.value = e.message || 'Failed to create contract'
  } finally {
    submitting.value = false
  }
}
</script>
