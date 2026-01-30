<template>
  <div>
    <Heading size="xl" class="mb-6">Create Group</Heading>
    
    <div class="bg-white rounded-lg shadow p-6 max-w-2xl">
      <GroupForm @submit="handleSubmit" @cancel="handleCancel" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useSupabaseClient } from '#imports'
import Heading from '~/components/ui/Heading.vue'
import GroupForm from '~/components/forms/GroupForm.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const router = useRouter()
const supabase = useSupabaseClient()

const handleSubmit = async (formData: any) => {
  try {
    const { data, error } = await supabase
      .from('groups')
      .insert([formData])
      .select()
      .single()

    if (error) throw error

    await router.push(`/admin/groups/${data.id}`)
  } catch (error: any) {
    alert(error.message || 'Failed to create group')
    console.error('Error creating group:', error)
  }
}

const handleCancel = () => {
  router.push('/admin/groups')
}
</script>
