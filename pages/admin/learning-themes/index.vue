<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div>
        <Heading size="xl">Bildungsbereiche & Themen</Heading>
        <p class="text-sm text-gray-600 mt-1">Projektbasierte Lernbereiche für die Gruppen</p>
      </div>
      <NuxtLink
        to="/admin/learning-themes/new"
        class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
      >
        <span>➕</span>
        <span>Neues Thema</span>
      </NuxtLink>
    </div>

    <div class="mb-4 flex gap-4">
      <select
        v-model="selectedStatus"
        class="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        @change="fetchThemes"
      >
        <option value="">Alle Status</option>
        <option value="active">Aktiv</option>
        <option value="completed">Abgeschlossen</option>
        <option value="planned">Geplant</option>
      </select>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error.message || 'Error loading learning themes'" />
    </div>

    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <div v-if="themes.length === 0" class="p-8 text-center text-gray-500">
        No learning themes found.
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        <div
          v-for="theme in themes"
          :key="theme.id"
          class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div class="mb-2">
            <span :class="[
              'px-2 py-1 text-xs rounded',
              theme.status === 'active' ? 'bg-green-100 text-green-700' :
              theme.status === 'completed' ? 'bg-gray-100 text-gray-700' :
              'bg-blue-100 text-blue-700'
            ]">
              {{ theme.status }}
            </span>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">{{ theme.title }}</h3>
          <p v-if="theme.description" class="text-sm text-gray-600 mb-3 line-clamp-2">
            {{ theme.description }}
          </p>
          <div v-if="theme.learning_areas && theme.learning_areas.length > 0" class="mb-3">
            <p class="text-xs text-gray-500 mb-1">Learning Areas:</p>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="area in theme.learning_areas"
                :key="area"
                class="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
              >
                {{ area }}
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2 mt-3">
            <NuxtLink
              :to="`/admin/learning-themes/${theme.id}`"
              class="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-sm"
            >
              <span>👁️</span>
              <span>Ansehen</span>
            </NuxtLink>
            <NuxtLink
              :to="`/admin/learning-themes/${theme.id}?edit=true`"
              class="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-md hover:bg-yellow-100 transition-colors text-sm"
            >
              <span>✏️</span>
              <span>Bearbeiten</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useLearningThemesStore } from '~/stores/learningThemes'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const learningThemesStore = useLearningThemesStore()

const selectedStatus = ref('')
const { learningThemes: themes, loading, error } = storeToRefs(learningThemesStore)

onMounted(async () => {
  await learningThemesStore.fetchLearningThemes()
})

const fetchThemes = async () => {
  await learningThemesStore.fetchLearningThemes(undefined, selectedStatus.value || undefined)
}
</script>
