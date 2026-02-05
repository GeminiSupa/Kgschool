<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div class="ios-page-header">
        <div class="flex justify-between items-center">
          <div>
            <h1>Gruppen</h1>
          </div>
          <NuxtLink
            to="/admin/groups/new"
            class="ios-button ios-button-primary inline-flex items-center gap-2"
          >
            ➕ Gruppe erstellen
          </NuxtLink>
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else>
      <IOSCard customClass="overflow-hidden">
        <div v-if="groups.length === 0" class="p-8 text-center text-gray-600">
          <div class="text-6xl mb-4 opacity-50">👪</div>
          <p class="text-lg font-semibold text-gray-900 mb-2">Noch keine Gruppen erstellt</p>
          <p class="text-sm text-gray-600">Erstellen Sie Ihre erste Gruppe, um zu beginnen.</p>
        </div>

        <div v-else class="divide-y divide-gray-200">
          <div
            v-for="group in groups"
            :key="group.id"
            class="p-6 hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <p class="text-lg font-semibold text-gray-900">{{ group.name }}</p>
                <p class="text-sm text-gray-600 mt-1">
                  Altersbereich: {{ group.age_range }} | Kapazität: {{ group.capacity }}
                </p>
                <p v-if="group.educator_id" class="text-sm text-gray-500 mt-1">
                  Erzieher: {{ getTeacherName(group.educator_id) }}
                </p>
                <p v-else class="text-sm text-orange-600 mt-1">
                  Kein Erzieher zugewiesen
                </p>
              </div>
              <NuxtLink
                :to="`/admin/groups/${group.id}`"
                class="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Ansehen →
              </NuxtLink>
            </div>
          </div>
        </div>
      </IOSCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSupabaseClient } from '#imports'
import { useGroupsStore } from '~/stores/groups'
import { useKita } from '~/composables/useKita'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'
import IOSCard from '~/components/ui/IOSCard.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const supabase = useSupabaseClient()
const groupsStore = useGroupsStore()
const { getUserKitaId } = useKita()
const { groups, loading, error } = storeToRefs(groupsStore)
const teachers = ref<any[]>([])

onMounted(async () => {
  const kitaId = await getUserKitaId()
  await Promise.all([
    groupsStore.fetchGroups(kitaId || undefined),
    fetchTeachers()
  ])
})

const fetchTeachers = async () => {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'teacher')

  teachers.value = data || []
}

const getTeacherName = (teacherId: string) => {
  const teacher = teachers.value.find(t => t.id === teacherId)
  return teacher ? teacher.full_name : teacherId
}
</script>
