<template>
  <div>
    <Heading size="xl" class="mb-6 text-white drop-shadow">Neues Personalmitglied hinzufügen</Heading>
    
    <div class="bg-white rounded-lg shadow p-6 max-w-2xl">
      <StaffForm @submit="handleSubmit" @cancel="handleCancel" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import Heading from '~/components/ui/Heading.vue'
import StaffForm from '~/components/forms/StaffForm.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const router = useRouter()

const handleSubmit = async (formData: any) => {
  try {
    const response = await $fetch('/api/admin/users/create', {
      method: 'POST',
      body: formData
    })

    if (response.success) {
      await router.push(`/admin/staff/${response.user.id}`)
    }
  } catch (error: any) {
    alert(error.data?.message || error.message || 'Failed to create staff member')
    console.error('Error creating staff:', error)
  }
}

const handleCancel = () => {
  router.push('/admin/staff')
}
</script>
