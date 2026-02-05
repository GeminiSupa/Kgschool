<template>
  <div>
    <div class="mb-6">
      <Heading size="xl">Consent Management (DSGVO)</Heading>
      <p class="text-gray-600 mt-2">Manage data processing consents for children</p>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else class="space-y-6">
      <!-- Child Selector -->
      <div class="bg-white rounded-lg shadow p-4">
        <label for="child_filter" class="block text-sm font-medium text-gray-700 mb-2">
          Filter by Child
        </label>
        <select
          id="child_filter"
          v-model="selectedChildId"
          @change="loadConsents"
          class="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Children</option>
          <option v-for="child in children" :key="child.id" :value="child.id">
            {{ child.first_name }} {{ child.last_name }}
          </option>
        </select>
      </div>

      <!-- Consents List -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Child</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Consent Type</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Granted</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revoked</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="consent in consents" :key="consent.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ getChildName(consent.child_id) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatConsentType(consent.consent_type) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="consent.granted
                    ? 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800'
                    : 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800'"
                >
                  {{ consent.granted ? 'Granted' : 'Revoked' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ consent.granted_at ? formatDate(consent.granted_at) : '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ consent.revoked_at ? formatDate(consent.revoked_at) : '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  v-if="consent.granted"
                  @click="revokeConsent(consent.child_id, consent.consent_type)"
                  class="text-red-600 hover:text-red-900"
                >
                  Revoke
                </button>
                <button
                  v-else
                  @click="grantConsent(consent.child_id, consent.consent_type)"
                  class="text-green-600 hover:text-green-900"
                >
                  Grant
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="consents.length === 0" class="text-center py-12 text-gray-500">
          No consents found
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
import { useConsentsStore } from '~/stores/consents'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'
import type { Consent } from '~/stores/consents'

type ConsentType = 'photo' | 'messaging' | 'emergency_data' | 'third_party_tools' | 'data_processing' | 'publication'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const consentsStore = useConsentsStore()
const loading = ref(true)
const error = ref('')
const selectedChildId = ref('')
const children = ref<any[]>([])
const childrenMap = ref<Record<string, string>>({})

const consents = computed(() => consentsStore.consents)

onMounted(async () => {
  await Promise.all([
    loadChildren(),
    loadConsents()
  ])
})

const loadChildren = async () => {
  try {
    const supabase = useSupabaseClient()
    const { data } = await supabase
      .from('children')
      .select('id, first_name, last_name')
      .eq('status', 'active')
      .order('first_name')

    children.value = data || []
    data?.forEach(child => {
      childrenMap.value[child.id] = `${child.first_name} ${child.last_name}`
    })
  } catch (e: any) {
    console.error('Error loading children:', e)
  }
}

const loadConsents = async () => {
  loading.value = true
  try {
    await consentsStore.fetchConsents(selectedChildId.value || undefined)
  } catch (e: any) {
    error.value = e.message || 'Failed to load consents'
  } finally {
    loading.value = false
  }
}

const getChildName = (childId: string) => {
  return childrenMap.value[childId] || childId
}

const formatConsentType = (type: string) => {
  const types: Record<string, string> = {
    photo: 'Photo/Video',
    messaging: 'Messaging',
    emergency_data: 'Emergency Data',
    third_party_tools: 'Third-Party Tools',
    data_processing: 'Data Processing',
    publication: 'Publication'
  }
  return types[type] || type
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

const grantConsent = async (childId: string, consentType: ConsentType) => {
  if (!confirm(`Grant ${formatConsentType(consentType)} consent for ${getChildName(childId)}?`)) return

  try {
    await consentsStore.grantConsent(childId, consentType)
    await loadConsents()
    alert('Consent granted!')
  } catch (e: any) {
    alert(e.message || 'Failed to grant consent')
  }
}

const revokeConsent = async (childId: string, consentType: ConsentType) => {
  if (!confirm(`Revoke ${formatConsentType(consentType)} consent for ${getChildName(childId)}?`)) return

  try {
    await consentsStore.revokeConsent(childId, consentType)
    await loadConsents()
    alert('Consent revoked!')
  } catch (e: any) {
    alert(e.message || 'Failed to revoke consent')
  }
}
</script>
