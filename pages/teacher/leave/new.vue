<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/teacher/leave"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Leave Requests
      </NuxtLink>
      <Heading size="xl">Request Leave</Heading>
    </div>

    <div class="bg-white rounded-lg shadow p-6 max-w-2xl">
      <TeacherLeaveRequestForm
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useTeacherLeaveRequestsStore } from '~/stores/teacherLeaveRequests'
import Heading from '~/components/ui/Heading.vue'
import TeacherLeaveRequestForm from '~/components/forms/TeacherLeaveRequestForm.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'teacher'
})

const router = useRouter()
const teacherLeaveRequestsStore = useTeacherLeaveRequestsStore()

const handleSubmit = async (data: any) => {
  try {
    await teacherLeaveRequestsStore.createLeaveRequest(data)
    alert('Leave request submitted successfully!')
    router.push('/teacher/leave')
  } catch (error: any) {
    alert(error.message || 'Failed to submit leave request')
  }
}

const handleCancel = () => {
  router.push('/teacher/leave')
}
</script>
