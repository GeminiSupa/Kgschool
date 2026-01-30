<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div>
      <Heading size="xl" class="text-gray-900">Kinder</Heading>
      <p class="text-sm text-gray-600 mt-1">Verwalten Sie alle Kinder in der Kita</p>
      </div>
      <NuxtLink
        to="/admin/children/new"
        class="ios-button ios-button-primary inline-flex items-center gap-2"
      >
        <span>➕</span>
        <span>Neues Kind hinzufügen</span>
      </NuxtLink>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else>
      <IOSCard customClass="overflow-hidden">
        <div v-if="children.length === 0" class="p-8 text-center text-gray-600">
          <div class="text-6xl mb-4 opacity-50">👶</div>
          <p class="text-lg font-semibold text-gray-900 mb-2">Keine Kinder gefunden</p>
          <p class="text-sm text-gray-600">Fügen Sie Ihr erstes Kind hinzu, um zu beginnen.</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="ios-glass">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Name
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Geburtsdatum
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Gruppe
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="child in children" :key="child.id" class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-semibold text-gray-900">
                    {{ child.first_name }} {{ child.last_name }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {{ formatDate(child.date_of_birth) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {{ getGroupName(child.group_id) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      'px-3 py-1 text-xs font-semibold rounded-full',
                      child.status === 'active' ? 'bg-green-100 text-green-800' :
                      child.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    ]"
                  >
                    {{ getStatusLabel(child.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex items-center justify-end gap-2">
                    <NuxtLink
                      :to="`/admin/children/${child.id}`"
                      class="ios-button ios-button-secondary text-sm px-3 py-1.5 inline-flex items-center gap-1"
                    >
                      <span>👁️</span>
                      <span>Ansehen</span>
                    </NuxtLink>
                    <NuxtLink
                      :to="`/admin/children/${child.id}?edit=true`"
                      class="ios-button ios-button-secondary text-sm px-3 py-1.5 inline-flex items-center gap-1"
                    >
                      <span>✏️</span>
                      <span>Bearbeiten</span>
                    </NuxtLink>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </IOSCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useChildrenStore } from '~/stores/children'
import { useGroupsStore } from '~/stores/groups'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'
import IOSCard from '~/components/ui/IOSCard.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const childrenStore = useChildrenStore()
const groupsStore = useGroupsStore()
const { children, loading, error } = storeToRefs(childrenStore)
const { groups } = storeToRefs(groupsStore)

onMounted(async () => {
  await Promise.all([
    childrenStore.fetchChildren(),
    groupsStore.fetchGroups()
  ])
})

const getGroupName = (groupId: string | null) => {
  if (!groupId) return 'Nicht zugewiesen'
  const group = groups.value.find(g => g.id === groupId)
  return group ? group.name : 'Unbekannt'
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('de-DE')
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    active: 'Aktiv',
    inactive: 'Inaktiv',
    pending: 'Ausstehend'
  }
  return labels[status] || status
}
</script>
