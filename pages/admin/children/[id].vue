<template>
  <div>
    <!-- Render child routes if we're on a child route -->
    <NuxtPage v-if="isChildRoute" />
    
    <!-- Otherwise render the parent route content -->
    <template v-else>
      <div class="flex items-center gap-4 mb-6">
        <NuxtLink
          to="/admin/children"
          class="link-fiori"
        >
          ← Back to Children
        </NuxtLink>
      </div>

      <div v-if="loading" class="flex justify-center py-12">
        <LoadingSpinner />
      </div>

      <div v-else-if="error" class="mb-6">
        <ErrorAlert :message="error" />
      </div>

      <div v-else-if="child">
        <IOSCard customClass="max-w-2xl p-6">
      <Heading size="xl" class="mb-6 text-fiori-gray-900">
        {{ child.first_name }} {{ child.last_name }}
      </Heading>

      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label-fiori">Vorname</label>
            <p class="mt-1 text-fiori-gray-900">{{ child.first_name }}</p>
          </div>
          <div>
            <label class="form-label-fiori">Nachname</label>
            <p class="mt-1 text-fiori-gray-900">{{ child.last_name }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label-fiori">Geburtsdatum</label>
            <p class="mt-1 text-fiori-gray-900">{{ formatDate(child.date_of_birth) }}</p>
          </div>
          <div>
            <label class="form-label-fiori">Einschulungsdatum</label>
            <p class="mt-1 text-fiori-gray-900">{{ formatDate(child.enrollment_date) }}</p>
          </div>
        </div>

        <div>
          <label class="form-label-fiori mb-2">Gruppe</label>
          <div v-if="child.group_id && groupInfo" class="space-y-2">
            <div class="flex items-center gap-2">
              <p class="text-fiori-gray-900 font-medium">{{ groupInfo.name }} ({{ groupInfo.age_range }})</p>
              <NuxtLink
                :to="`/admin/groups/${child.group_id}`"
                class="link-fiori text-xs"
              >
                Gruppe ansehen →
              </NuxtLink>
            </div>
            <div v-if="groupTeachers.length > 0" class="text-sm text-fiori-gray-600">
              <span class="font-medium">Lehrer:</span>
              <span class="ml-1">
                {{ groupTeachers.map(t => t.full_name).join(', ') }}
              </span>
            </div>
          </div>
          <p v-else class="mt-1 text-fiori-gray-900">Nicht zugewiesen</p>
          <NuxtLink
            :to="`/admin/children/${route.params.id}/change-group`"
            class="link-fiori mt-2 inline-block text-sm"
          >
            {{ child.group_id ? 'Gruppe ändern' : 'Gruppe zuweisen' }} →
          </NuxtLink>
        </div>

        <div>
          <label class="form-label-fiori">Status</label>
          <span
            :class="[
              'badge-fiori mt-1',
              child.status === 'active' ? 'badge-fiori-success' :
              child.status === 'inactive' ? 'badge-fiori-neutral' :
              'badge-fiori-warning'
            ]"
          >
            {{ child.status === 'active' ? 'Aktiv' : child.status === 'inactive' ? 'Inaktiv' : 'Ausstehend' }}
          </span>
        </div>

        <div class="pt-4 border-t">
          <label class="form-label-fiori mb-2">Zugewiesenes Personal</label>
          <TeacherAssignmentList
            :child-id="child.id"
            :can-edit="false"
            :can-delete="false"
          />
        </div>

        <div class="pt-4 border-t border-fiori-gray-200 space-y-2">
          <button
            @click="navigateToAssignTeachers"
            class="ios-button ios-button-secondary w-full text-left"
          >
            👥 Lehrer zuweisen
          </button>
          <button
            @click="navigateToManageParents"
            class="ios-button ios-button-secondary w-full text-left"
          >
            👨‍👩‍👧 Eltern verwalten
          </button>
          <NuxtLink
            :to="`/admin/attendance?child_id=${childId || route.params.id}`"
            class="ios-button ios-button-secondary w-full text-left block"
          >
            ✅ Anwesenheit ansehen
          </NuxtLink>
        </div>
      </div>
      </IOSCard>
    </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChildrenStore } from '~/stores/children'
import { useGroupsStore } from '~/stores/groups'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'
import TeacherAssignmentList from '~/components/common/TeacherAssignmentList.vue'
import IOSCard from '~/components/ui/IOSCard.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const route = useRoute()
const router = useRouter()
const childrenStore = useChildrenStore()
const groupsStore = useGroupsStore()

// Check if we're on a child route (assign-teachers, parents, change-group)
const isChildRoute = computed(() => {
  const path = route.path
  return path.includes('/assign-teachers') || 
         path.includes('/parents') || 
         path.includes('/change-group')
})

const child = ref<any>(null)
const groupInfo = ref<any>(null)
const groupTeachers = ref<any[]>([])
const loading = ref(true)
const error = ref('')

// Computed properties for links to ensure they're always reactive
const childId = computed(() => route.params.id as string)
const assignTeachersLink = computed(() => `/admin/children/${childId.value}/assign-teachers`)
const manageParentsLink = computed(() => `/admin/children/${childId.value}/parents`)
const viewAttendanceLink = computed(() => `/admin/attendance?child_id=${childId.value}`)

onMounted(async () => {
  try {
    const id = childId.value
    if (!id) {
      error.value = 'Child ID is missing'
      console.error('Child ID is missing from route params:', route.params)
      return
    }

    console.log('Loading child with ID:', id)
    console.log('Route params:', route.params)
    console.log('Assign teachers link:', assignTeachersLink.value)
    console.log('Manage parents link:', manageParentsLink.value)
    
    const childData = await childrenStore.fetchChildById(id)
    if (!childData) {
      error.value = 'Child not found'
      return
    }
    child.value = childData

    // Load group info if assigned
    if (childData.group_id) {
      groupInfo.value = await groupsStore.fetchGroupById(childData.group_id)
      const teachers = await groupsStore.fetchGroupTeachers(childData.group_id)
      groupTeachers.value = teachers || []
    }
  } catch (e: any) {
    console.error('Error loading child:', e)
    error.value = e.message || 'Failed to load child'
  } finally {
    loading.value = false
  }
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

const navigateToAssignTeachers = async () => {
  const id = childId.value || (route.params.id as string) || child.value?.id
  console.log('navigateToAssignTeachers - ID:', id)
  if (!id) {
    alert('Child ID is missing. Please refresh the page.')
    return
  }
  const path = `/admin/children/${id}/assign-teachers`
  console.log('Navigating to:', path)
  
  // Try navigateTo first (Nuxt's way)
  try {
    await navigateTo(path)
    console.log('Navigation with navigateTo successful')
  } catch (err: any) {
    console.error('navigateTo error:', err)
    // Try router.push as fallback
    try {
      await router.push(path)
      console.log('Navigation with router.push successful')
    } catch (err2: any) {
      console.error('router.push error:', err2)
      // Last resort: window.location
      console.log('Using window.location as fallback')
      window.location.href = path
    }
  }
}

const navigateToManageParents = async () => {
  const id = childId.value || (route.params.id as string) || child.value?.id
  console.log('navigateToManageParents - ID:', id)
  if (!id) {
    alert('Child ID is missing. Please refresh the page.')
    return
  }
  const path = `/admin/children/${id}/parents`
  console.log('Navigating to:', path)
  
  // Try navigateTo first (Nuxt's way)
  try {
    await navigateTo(path)
    console.log('Navigation with navigateTo successful')
  } catch (err: any) {
    console.error('navigateTo error:', err)
    // Try router.push as fallback
    try {
      await router.push(path)
      console.log('Navigation with router.push successful')
    } catch (err2: any) {
      console.error('router.push error:', err2)
      // Last resort: window.location
      console.log('Using window.location as fallback')
      window.location.href = path
    }
  }
}

const navigateToViewAttendance = () => {
  const id = childId.value || (route.params.id as string) || child.value?.id
  if (!id) {
    alert('Child ID is missing. Please refresh the page.')
    return
  }
  router.push(`/admin/attendance?child_id=${id}`).catch(err => {
    console.error('Navigation error:', err)
  })
}
</script>
