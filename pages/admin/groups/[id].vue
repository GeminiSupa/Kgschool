<template>
  <div>
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink
        to="/admin/groups"
        class="text-gray-600 hover:text-gray-900"
      >
        ← Back to Groups
      </NuxtLink>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else-if="group" class="space-y-6">
      <!-- Group Information -->
      <IOSCard customClass="p-6">
        <div class="flex items-center justify-between mb-6">
          <Heading size="xl">{{ group.name }}</Heading>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100">
            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Age Range</label>
            <p class="text-lg font-bold text-gray-900">{{ group.age_range || 'Not specified' }}</p>
          </div>
          <div class="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Capacity</label>
            <GroupCapacityIndicator
              :current="capacity.current"
              :max="capacity.max"
            />
          </div>
        </div>
      </IOSCard>

      <!-- Teacher Assignment Section -->
      <IOSCard customClass="p-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <Heading size="md" class="mb-1">Assigned Teachers</Heading>
            <p class="text-sm text-gray-500">{{ assignedTeachers.length }} teacher{{ assignedTeachers.length !== 1 ? 's' : '' }} assigned</p>
          </div>
          <button
            @click.prevent="toggleAddForm"
            type="button"
            class="ios-button ios-button-primary text-sm px-4 py-2 whitespace-nowrap"
          >
            {{ showAddForm ? '✕ Cancel' : '+ Add Teacher' }}
          </button>
        </div>

        <!-- Add Teacher Form -->
        <div v-if="showAddForm" class="mb-6 p-5 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-200 shadow-sm">
          <!-- Debug Info -->
          <div v-if="debugInfo.show" class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs">
            <div class="flex justify-between items-start mb-2">
              <p class="font-semibold">🔍 Debug Info (Single Kita Mode):</p>
              <button
                type="button"
                @click="debugInfo.show = false"
                class="text-blue-600 hover:text-blue-800 font-bold"
              >
                ✕
              </button>
            </div>
            <ul class="space-y-1 text-gray-700">
              <li><strong>Total teachers in database:</strong> {{ debugInfo.totalTeachers }}</li>
              <li><strong>Available teachers:</strong> {{ availableTeachers.length }}</li>
              <li><strong>Assigned teachers:</strong> {{ assignedTeachers.length }}</li>
              <li class="text-gray-500 text-xs mt-2">Note: kita_id is optional for single-Kita setup</li>
            </ul>
            <div v-if="debugInfo.totalTeachers === 0" class="mt-3 p-2 bg-red-100 rounded text-red-800">
              ⚠️ <strong>No teachers found in database.</strong><br>
              <span class="text-xs">To fix: Create teachers in the profiles table with role='teacher' or 'support'</span>
            </div>
            <div v-else-if="availableTeachers.length === 0 && assignedTeachers.length > 0" class="mt-3 p-2 bg-yellow-100 rounded text-yellow-800">
              ℹ️ All teachers are already assigned to this group.
            </div>
          </div>

          <form @submit.prevent="handleAddTeacher" class="space-y-5">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label for="teacher_id" class="block text-sm font-semibold text-gray-700 mb-2">
                  Teacher <span class="text-red-500">*</span>
                </label>
                <select
                  id="teacher_id"
                  v-model="newAssignment.teacher_id"
                  required
                  :disabled="teachersLoading"
                  class="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 transition-all"
                >
                  <option value="">
                    {{ teachersLoading ? 'Loading teachers...' : availableTeachers.length === 0 ? (teachers.length === 0 ? 'No teachers found' : 'All teachers assigned') : 'Select teacher' }}
                  </option>
                  <option
                    v-for="teacher in availableTeachers"
                    :key="teacher.id"
                    :value="teacher.id"
                  >
                    {{ teacher.full_name }} ({{ teacher.role }})
                  </option>
                </select>
                <div v-if="!teachersLoading" class="text-xs mt-1 space-y-1">
                  <p v-if="teachers.length === 0" class="text-red-600">
                    ⚠️ No teachers found. 
                    <button
                      type="button"
                      @click="loadDebugInfo"
                      class="underline hover:no-underline font-semibold"
                    >
                      Check diagnostics
                    </button>
                  </p>
                  <p v-else-if="availableTeachers.length === 0" class="text-yellow-600">
                    ℹ️ All {{ teachers.length }} teachers are already assigned.
                  </p>
                  <p v-else class="text-gray-600">
                    {{ availableTeachers.length }} of {{ teachers.length }} teachers available
                  </p>
                </div>
              </div>

              <div>
                <label for="role" class="block text-sm font-semibold text-gray-700 mb-2">
                  Role <span class="text-red-500">*</span>
                </label>
                <select
                  id="role"
                  v-model="newAssignment.role"
                  required
                  class="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="primary">Primary Teacher</option>
                  <option value="assistant">Assistant Teacher</option>
                  <option value="support">Support Staff</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="start_date" class="block text-sm font-semibold text-gray-700 mb-2">
                  Start Date <span class="text-red-500">*</span>
                </label>
                <input
                  id="start_date"
                  v-model="newAssignment.start_date"
                  type="date"
                  required
                  class="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label for="end_date" class="block text-sm font-semibold text-gray-700 mb-2">
                  End Date (Optional)
                </label>
                <input
                  id="end_date"
                  v-model="newAssignment.end_date"
                  type="date"
                  :min="newAssignment.start_date"
                  class="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label for="notes" class="block text-sm font-semibold text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                v-model="newAssignment.notes"
                rows="3"
                class="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                placeholder="Additional notes about this assignment..."
              />
            </div>

            <div class="flex gap-3 justify-end pt-2">
              <button
                type="button"
                @click="cancelAddTeacher"
                class="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="addingTeacher"
                class="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
              >
                {{ addingTeacher ? '⏳ Adding...' : '✅ Add Teacher' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Teachers List -->
        <div v-if="teachersLoading" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="mt-4 text-gray-500">Loading teachers...</p>
        </div>
        <div v-else-if="assignedTeachers.length === 0" class="text-center py-12">
          <div class="text-6xl mb-4 opacity-30">👨‍🏫</div>
          <p class="text-gray-600 font-medium mb-2">No teachers assigned yet</p>
          <p class="text-sm text-gray-500">Click "Add Teacher" to assign a teacher to this group.</p>
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="assignment in assignedTeachers"
            :key="assignment.id"
            class="p-5 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200"
            :class="assignment.role === 'primary' ? 'ring-2 ring-blue-200 bg-blue-50/30' : ''"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <p class="font-bold text-lg text-gray-900">{{ getTeacherName(assignment.teacher_id) }}</p>
                  <span
                    :class="[
                      'px-2.5 py-1 text-xs font-semibold rounded-full',
                      assignment.role === 'primary'
                        ? 'bg-blue-500 text-white shadow-sm'
                        : assignment.role === 'assistant'
                        ? 'bg-green-500 text-white shadow-sm'
                        : 'bg-gray-400 text-white shadow-sm'
                    ]"
                  >
                    {{ formatRole(assignment.role) }}
                  </span>
                </div>
                <div class="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <span class="text-gray-400">📅</span>
                  <span>{{ formatDate(assignment.start_date) }}</span>
                  <span v-if="assignment.end_date" class="text-gray-400">-</span>
                  <span v-if="assignment.end_date">{{ formatDate(assignment.end_date) }}</span>
                  <span v-else class="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    Active
                  </span>
                </div>
                <p v-if="assignment.notes" class="text-xs text-gray-500 mt-2 italic">
                  📝 {{ assignment.notes }}
                </p>
              </div>
            </div>
            <div class="flex gap-2 pt-3 border-t border-gray-100">
              <button
                v-if="assignment.role !== 'primary'"
                @click="setAsPrimary(assignment)"
                class="flex-1 px-3 py-2 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                title="Set as primary teacher"
              >
                ⭐ Set Primary
              </button>
              <button
                @click="removeTeacher(assignment)"
                class="flex-1 px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                title="Remove teacher"
              >
                🗑️ Remove
              </button>
            </div>
          </div>
        </div>
      </IOSCard>

      <!-- Children in Group -->
      <IOSCard customClass="p-6">
        <div class="mb-6">
          <Heading size="md" class="mb-1">Children in Group</Heading>
          <p class="text-sm text-gray-500">{{ childrenInGroup.length }} child{{ childrenInGroup.length !== 1 ? 'ren' : '' }} in this group</p>
        </div>
        <div v-if="childrenInGroup.length === 0" class="text-center py-12">
          <div class="text-6xl mb-4 opacity-30">👶</div>
          <p class="text-gray-600 font-medium mb-2">No children in this group yet</p>
          <p class="text-sm text-gray-500">Assign children to this group from their profile pages.</p>
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <NuxtLink
            v-for="child in childrenInGroup"
            :key="child.id"
            :to="`/admin/children/${child.id}`"
            class="group block p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-200"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                {{ (child.first_name?.[0] || '') + (child.last_name?.[0] || '') }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                  {{ child.first_name }} {{ child.last_name }}
                </p>
                <p v-if="child.date_of_birth" class="text-xs text-gray-500 mt-0.5">
                  {{ new Date().getFullYear() - new Date(child.date_of_birth).getFullYear() }} years old
                </p>
              </div>
              <span class="text-gray-400 group-hover:text-blue-500 transition-colors">→</span>
            </div>
          </NuxtLink>
        </div>
      </IOSCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useSupabaseClient } from '#imports'
import { useGroupsStore } from '~/stores/groups'
import { useChildrenStore } from '~/stores/children'
import { useGroupTeachersStore } from '~/stores/groupTeachers'
import { useKita } from '~/composables/useKita'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'
import IOSCard from '~/components/ui/IOSCard.vue'
import GroupCapacityIndicator from '~/components/groups/GroupCapacityIndicator.vue'
import type { GroupTeacher } from '~/stores/groupTeachers'

const toast = inject<{ addToast: (message: string, type: string, duration?: number) => void }>('toast', null)

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const route = useRoute()
const supabase = useSupabaseClient()
const groupsStore = useGroupsStore()
const childrenStore = useChildrenStore()
const groupTeachersStore = useGroupTeachersStore()
const { getUserKitaId } = useKita()

const group = ref<any>(null)
const loading = ref(true)
const error = ref('')
const childrenInGroup = ref<any[]>([])
const capacity = ref({ current: 0, max: 0, available: 0 })

// Teacher assignment state
const showAddForm = ref(false)
const addingTeacher = ref(false)
const teachersLoading = ref(false)
const teachers = ref<any[]>([])
const assignedTeachers = ref<GroupTeacher[]>([])
const teacherNames = ref<Record<string, string>>({})

// Debug info
const debugInfo = ref({
  show: false,
  groupKitaId: '',
  userKitaId: '',
  totalTeachers: 0,
  orgTeachers: 0
})

const newAssignment = ref({
  teacher_id: '',
  role: 'assistant' as 'primary' | 'assistant' | 'support',
  start_date: new Date().toISOString().split('T')[0],
  end_date: '',
  notes: ''
})

const { groups } = storeToRefs(groupsStore)
const { children } = storeToRefs(childrenStore)

onMounted(async () => {
  try {
    await Promise.all([
      groupsStore.fetchGroups(),
      childrenStore.fetchChildren()
    ])

    const groupData = await groupsStore.fetchGroupById(route.params.id as string)
    if (!groupData) {
      error.value = 'Group not found'
      return
    }

    group.value = groupData

    // Get children in this group
    const childrenArray = Array.isArray(children.value) ? children.value : []
    childrenInGroup.value = childrenArray.filter(c => c.group_id === groupData.id)

    // Get capacity
    capacity.value = await groupsStore.getGroupCapacity(groupData.id)

    // Load teachers and assignments (after group is set)
    await Promise.all([
      loadTeachers(groupData),
      loadAssignedTeachers()
    ])
  } catch (e: any) {
    error.value = e.message || 'Failed to load group'
  } finally {
    loading.value = false
  }
})

const loadTeachers = async (groupData?: any) => {
  try {
    teachersLoading.value = true
    console.log('🔵 loadTeachers: Starting...')
    
    // For single-Kita setup: Load all teachers directly without kita_id filtering
    console.log('🔵 loadTeachers: Querying profiles table...')
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['teacher', 'support'])
      .order('full_name')

    if (profilesError) {
      console.error('❌ loadTeachers: Error fetching profiles:', profilesError)
      throw profilesError
    }

    teachers.value = profilesData || []
    console.log('✅ loadTeachers: Success! Loaded', teachers.value.length, 'teachers')
    if (teachers.value.length > 0) {
      console.log('📋 Teachers:', teachers.value.map(t => `${t.full_name} (${t.role})`))
    }
    
    if (teachers.value.length === 0) {
      console.warn('⚠️ loadTeachers: No teachers found in database')
      toast?.addToast('No teachers found. Create teachers with role="teacher" or "support" in the profiles table.', 'info')
    }
  } catch (e: any) {
    console.error('❌ loadTeachers: Exception:', e)
    toast?.addToast(`Failed to load teachers: ${e.message || 'Unknown error'}`, 'error')
    teachers.value = []
  } finally {
    teachersLoading.value = false
    console.log('🔵 loadTeachers: Finished, loading =', teachersLoading.value)
  }
}

const loadAssignedTeachers = async () => {
  try {
    await groupTeachersStore.fetchGroupTeachers(route.params.id as string)
    assignedTeachers.value = groupTeachersStore.assignments

    // Load teacher names
    const teacherIds = [...new Set(assignedTeachers.value.map(t => t.teacher_id))]
    if (teacherIds.length > 0) {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', teacherIds)

      if (data) {
        data.forEach(profile => {
          teacherNames.value[profile.id] = profile.full_name
        })
      }
    }
  } catch (e: any) {
    console.error('Error loading assigned teachers:', e)
    toast?.addToast('Failed to load assigned teachers', 'error')
  }
}

const availableTeachers = computed(() => {
  const assignedIds = assignedTeachers.value
    .filter(a => !a.end_date || new Date(a.end_date) >= new Date())
    .map(a => a.teacher_id)
  return teachers.value.filter(t => !assignedIds.includes(t.id))
})

const handleAddTeacher = async () => {
  if (!newAssignment.value.teacher_id) {
    toast?.addToast('Please select a teacher', 'error')
    return
  }

  addingTeacher.value = true
  try {
    const assignmentData: Partial<GroupTeacher> = {
      group_id: route.params.id as string,
      teacher_id: newAssignment.value.teacher_id,
      role: newAssignment.value.role,
      start_date: newAssignment.value.start_date,
      notes: newAssignment.value.notes || undefined
    }

    if (newAssignment.value.end_date) {
      assignmentData.end_date = newAssignment.value.end_date
    }

    await groupTeachersStore.assignTeacherToGroup(assignmentData)
    toast?.addToast('Teacher assigned successfully!', 'success')
    
    // Reset form
    cancelAddTeacher()
    await loadAssignedTeachers()
  } catch (e: any) {
    console.error('Error adding teacher:', e)
    const errorMessage = e.message || 'Failed to assign teacher'
    if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
      toast?.addToast('This teacher is already assigned to this group', 'warning')
    } else {
      toast?.addToast(errorMessage, 'error')
    }
  } finally {
    addingTeacher.value = false
  }
}

const toggleAddForm = async (e?: Event) => {
  if (e) {
    e.preventDefault()
    e.stopPropagation()
  }
  
  console.log('toggleAddForm called, current state:', showAddForm.value)
  
  // Toggle the form state first
  showAddForm.value = !showAddForm.value
  console.log('Form state after toggle:', showAddForm.value)
  
  if (showAddForm.value) {
    // Opening form - always load teachers to ensure fresh data
    console.log('Opening form, loading teachers...')
    console.log('Current teachers count:', teachers.value.length, 'loading:', teachersLoading.value)
    await loadTeachers()
  } else {
    // Closing form
    cancelAddTeacher()
  }
}

const cancelAddTeacher = () => {
  showAddForm.value = false
  newAssignment.value = {
    teacher_id: '',
    role: 'assistant',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    notes: ''
  }
}

const removeTeacher = async (assignment: GroupTeacher) => {
  if (!confirm(`Are you sure you want to remove ${getTeacherName(assignment.teacher_id)} from this group?`)) {
    return
  }

  try {
    await groupTeachersStore.removeTeacherFromGroup(assignment.id)
    toast?.addToast('Teacher removed successfully', 'success')
    await loadAssignedTeachers()
  } catch (e: any) {
    console.error('Error removing teacher:', e)
    toast?.addToast(e.message || 'Failed to remove teacher', 'error')
  }
}

const setAsPrimary = async (assignment: GroupTeacher) => {
  try {
    await groupTeachersStore.setPrimaryTeacher(route.params.id as string, assignment.teacher_id)
    toast?.addToast('Primary teacher updated successfully', 'success')
    await loadAssignedTeachers()
  } catch (e: any) {
    console.error('Error setting primary teacher:', e)
    toast?.addToast(e.message || 'Failed to set primary teacher', 'error')
  }
}

const getTeacherName = (teacherId: string) => {
  return teacherNames.value[teacherId] || teachers.value.find(t => t.id === teacherId)?.full_name || teacherId
}

const formatRole = (role: string) => {
  const roles: Record<string, string> = {
    primary: 'Primary Teacher',
    assistant: 'Assistant Teacher',
    support: 'Support Staff'
  }
  return roles[role] || role
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('de-DE')
}

const loadDebugInfo = async () => {
  debugInfo.value.show = !debugInfo.value.show
  
  if (debugInfo.value.show) {
    debugInfo.value.groupKitaId = group.value?.kita_id || 'Not set (optional for single Kita)'
    debugInfo.value.userKitaId = await getUserKitaId() || 'Not set (optional for single Kita)'
    
    // Count total teachers
    const { count: teacherCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .in('role', ['teacher', 'support'])
    debugInfo.value.totalTeachers = teacherCount || 0
    
    // For single-Kita setup, orgTeachers = totalTeachers
    debugInfo.value.orgTeachers = debugInfo.value.totalTeachers
  }
}
</script>
