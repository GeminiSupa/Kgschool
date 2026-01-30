<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/admin/learning-themes"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Learning Themes
      </NuxtLink>
      <Heading size="xl">Learning Theme</Heading>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="!theme" class="p-8 text-center text-gray-500">
      Learning theme not found.
    </div>

    <div v-else class="bg-white rounded-lg shadow p-6 max-w-3xl">
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-medium text-gray-500">Title</h3>
          <p class="mt-1 text-lg text-gray-900">{{ theme.title }}</p>
        </div>

        <div>
          <h3 class="text-sm font-medium text-gray-500">Status</h3>
          <span :class="[
            'px-2 py-1 text-xs rounded',
            theme.status === 'active' ? 'bg-green-100 text-green-700' :
            theme.status === 'completed' ? 'bg-gray-100 text-gray-700' :
            'bg-blue-100 text-blue-700'
          ]">
            {{ theme.status }}
          </span>
        </div>

        <div v-if="theme.description">
          <h3 class="text-sm font-medium text-gray-500">Description</h3>
          <p class="mt-1 text-gray-900 whitespace-pre-wrap">{{ theme.description }}</p>
        </div>

        <div v-if="theme.learning_areas && theme.learning_areas.length > 0">
          <h3 class="text-sm font-medium text-gray-500">Learning Areas</h3>
          <div class="mt-1 flex flex-wrap gap-2">
            <span
              v-for="area in theme.learning_areas"
              :key="area"
              class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
            >
              {{ area }}
            </span>
          </div>
        </div>

        <div v-if="theme.activities && theme.activities.length > 0">
          <h3 class="text-sm font-medium text-gray-500">Activities</h3>
          <ul class="mt-1 list-disc list-inside text-gray-900">
            <li v-for="activity in theme.activities" :key="activity">{{ activity }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useLearningThemesStore } from '~/stores/learningThemes'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const route = useRoute()
const learningThemesStore = useLearningThemesStore()

const loading = ref(true)
const theme = ref<any>(null)

onMounted(async () => {
  try {
    const themeId = route.params.id as string
    await learningThemesStore.fetchLearningThemes()
    theme.value = learningThemesStore.learningThemes.find(t => t.id === themeId)
  } finally {
    loading.value = false
  }
})
</script>
