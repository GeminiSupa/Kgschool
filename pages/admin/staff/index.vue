<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div class="ios-page-header">
        <h1>Personalverwaltung</h1>
      </div>
      <div class="flex justify-end mb-6">
        <NuxtLink
          to="/admin/staff/new"
          class="ios-button ios-button-primary inline-flex items-center gap-2"
        >
          ➕ Personalmitglied hinzufügen
        </NuxtLink>
      </div>
    </div>

    <div class="mb-4 flex gap-2">
      <button
        @click="selectedRole = ''"
        :class="[
          'ios-button transition-colors',
          selectedRole === '' 
            ? 'ios-button-primary' 
            : 'ios-button-secondary'
        ]"
      >
        Alle
      </button>
      <button
        @click="selectedRole = 'teacher'"
        :class="[
          'ios-button transition-colors',
          selectedRole === 'teacher' 
            ? 'ios-button-primary' 
            : 'ios-button-secondary'
        ]"
      >
        Erzieher
      </button>
      <button
        @click="selectedRole = 'kitchen'"
        :class="[
          'ios-button transition-colors',
          selectedRole === 'kitchen' 
            ? 'ios-button-primary' 
            : 'ios-button-secondary'
        ]"
      >
        Küche
      </button>
      <button
        @click="selectedRole = 'support'"
        :class="[
          'ios-button transition-colors',
          selectedRole === 'support' 
            ? 'ios-button-primary' 
            : 'ios-button-secondary'
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

    <div v-else>
      <IOSCard customClass="overflow-hidden p-0">
        <div v-if="filteredStaff.length === 0" class="p-8 text-center text-gray-600">
          <div class="text-6xl mb-4 opacity-50">👥</div>
          <p class="text-lg font-semibold text-gray-900 mb-2">Keine Mitarbeiter gefunden</p>
          <p class="text-sm text-gray-600">Fügen Sie Ihren ersten Mitarbeiter hinzu, um zu beginnen.</p>
        </div>

        <template v-else>
          <!-- Mobile Card View -->
          <div class="block md:hidden space-y-3">
            <div
              v-for="member in filteredStaff"
              :key="member.id"
              class="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
            >
              <div class="flex items-start justify-between mb-3">
                <div>
                  <h3 class="text-base font-semibold text-gray-900">
                    {{ member.full_name }}
                  </h3>
                  <p class="text-sm text-gray-600 mt-1">{{ member.email }}</p>
                </div>
                <span
                  :class="[
                    'px-2 py-1 text-xs font-semibold rounded-full',
                    getRoleClass(member.role)
                  ]"
                >
                  {{ getRoleLabel(member.role) }}
                </span>
              </div>
              <div class="text-sm text-gray-600 mb-3" v-if="member.phone">
                <span class="font-medium">Telefon:</span> {{ member.phone }}
              </div>
              <div class="flex gap-2">
                <NuxtLink
                  :to="`/admin/staff/${member.id}`"
                  class="flex-1 ios-button ios-button-secondary text-sm px-3 py-2 text-center"
                >
                  👁️ Ansehen
                </NuxtLink>
                <NuxtLink
                  :to="`/admin/staff/${member.id}?edit=true`"
                  class="flex-1 ios-button ios-button-secondary text-sm px-3 py-2 text-center"
                >
                  ✏️ Bearbeiten
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- Desktop Table View -->
          <div class="hidden md:block overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="ios-glass">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">E-Mail</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Rolle</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Telefon</th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Aktionen</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="member in filteredStaff" :key="member.id" class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-semibold text-gray-900">
                    {{ member.full_name }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {{ member.email }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      'px-3 py-1 text-xs font-semibold rounded-full capitalize',
                      member.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                      member.role === 'kitchen' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    ]"
                  >
                    {{ member.role }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {{ member.phone || '-' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <NuxtLink
                    :to="`/admin/staff/${member.id}`"
                    class="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Ansehen
                  </NuxtLink>
                </td>
              </tr>
            </tbody>
          </table>
          </div>
        </template>
      </IOSCard>
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
import IOSCard from '~/components/ui/IOSCard.vue'

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

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    teacher: 'Erzieher',
    kitchen: 'Küche',
    support: 'Support',
    admin: 'Admin'
  }
  return labels[role] || role
}

const getRoleClass = (role: string) => {
  if (role === 'teacher') return 'bg-blue-100 text-blue-800'
  if (role === 'kitchen') return 'bg-yellow-100 text-yellow-800'
  if (role === 'support') return 'bg-green-100 text-green-800'
  return 'bg-gray-100 text-gray-800'
}
</script>
