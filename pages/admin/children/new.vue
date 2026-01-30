<template>
  <div>
    <Heading size="xl" class="mb-6">Add New Child</Heading>
    
    <IOSCard customClass="max-w-2xl p-6">
      <ChildForm @submit="handleSubmit" @cancel="handleCancel" />
    </IOSCard>
  </div>
</template>

<script setup lang="ts">
import { useSupabaseClient } from '#imports'
import { useRouter } from 'vue-router'
import Heading from '~/components/ui/Heading.vue'
import ChildForm from '~/components/forms/ChildForm.vue'
import IOSCard from '~/components/ui/IOSCard.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const supabase = useSupabaseClient()
const router = useRouter()

const handleSubmit = async (formData: any) => {
  try {
    const { data, error } = await supabase
      .from('children')
      .insert([formData])
      .select()
      .single()

    if (error) throw error

    await router.push(`/admin/children/${data.id}`)
  } catch (error: any) {
    console.error('Error creating child:', error)
    alert(error.message || 'Failed to create child')
  }
}

const handleCancel = () => {
  router.push('/admin/children')
}
</script>
