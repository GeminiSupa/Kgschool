<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/parent/leave"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Leave Requests
      </NuxtLink>
      <Heading size="xl">Request Leave</Heading>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else class="bg-white rounded-lg shadow p-6 max-w-2xl">
      <LeaveRequestForm
        :children="myChildren"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSupabaseClient } from '#imports'
import { useAuthStore } from '~/stores/auth'
import { useLeaveRequestsStore } from '~/stores/leaveRequests'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import LeaveRequestForm from '~/components/forms/LeaveRequestForm.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'parent'
})

const router = useRouter()
const supabase = useSupabaseClient()
const authStore = useAuthStore()
const leaveRequestsStore = useLeaveRequestsStore()

const loading = ref(true)
const myChildren = ref<any[]>([])

onMounted(async () => {
  try {
    const userId = authStore.user?.id
    if (!userId) return

    const { data: children } = await supabase
      .from('children')
      .select('*')
      .contains('parent_ids', [userId])

    myChildren.value = children || []
  } catch (error) {
    console.error('Error fetching children:', error)
  } finally {
    loading.value = false
  }
})

const handleSubmit = async (data: any) => {
  try {
    await leaveRequestsStore.createLeaveRequest(data)
    alert('Leave request submitted successfully!')
    router.push('/parent/leave')
  } catch (error: any) {
    alert(error.message || 'Failed to submit leave request')
  }
}

const handleCancel = () => {
  router.push('/parent/leave')
}
</script>
