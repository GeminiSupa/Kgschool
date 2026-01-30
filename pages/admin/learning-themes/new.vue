<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/admin/learning-themes"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Learning Themes
      </NuxtLink>
      <Heading size="xl">Create Learning Theme</Heading>
    </div>

    <div class="bg-white rounded-lg shadow p-6 max-w-3xl">
      <LearningThemeForm @submit="handleSubmit" @cancel="handleCancel" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useLearningThemesStore } from '~/stores/learningThemes'
import Heading from '~/components/ui/Heading.vue'
import LearningThemeForm from '~/components/forms/LearningThemeForm.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const router = useRouter()
const learningThemesStore = useLearningThemesStore()

const handleSubmit = async (data: any) => {
  try {
    await learningThemesStore.createLearningTheme(data)
    alert('Learning theme created successfully!')
    router.push('/admin/learning-themes')
  } catch (error: any) {
    alert(error.message || 'Failed to create learning theme')
  }
}

const handleCancel = () => {
  router.push('/admin/learning-themes')
}
</script>
