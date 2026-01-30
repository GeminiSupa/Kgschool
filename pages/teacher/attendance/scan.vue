<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/teacher/attendance"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Attendance
      </NuxtLink>
      <Heading size="xl">QR Code Scanner (Disabled)</Heading>
      <p class="text-gray-600 mt-2">QR code scanning has been disabled. Please use the manual attendance system.</p>
    </div>

    <div class="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
      <div v-if="error" class="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
        {{ error }}
      </div>

      <div class="text-center p-8">
        <div class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p class="text-sm text-yellow-800">
            QR code scanning is no longer available. Please use the enhanced attendance system with manual check-in/check-out or bulk actions.
          </p>
        </div>
        <NuxtLink
          to="/teacher/attendance"
          class="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Go to Attendance Page
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSupabaseClient } from '#imports'
import { useAttendanceStore } from '~/stores/attendance'
import Heading from '~/components/ui/Heading.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'teacher'
})

const supabase = useSupabaseClient()
const attendanceStore = useAttendanceStore()

const scanning = ref(false)
const error = ref('')
const lastScanned = ref('')

const startScanning = () => {
  scanning.value = true
  // QR code scanning would be implemented here with vue-qrcode-reader
  // For now, placeholder
  alert('QR code scanning will be implemented with vue-qrcode-reader library')
  scanning.value = false
}

const stopScanning = () => {
  scanning.value = false
}
</script>
