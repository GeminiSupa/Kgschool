import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import { useKita } from '~/composables/useKita'

export interface ParentWorkTask {
  id: string
  title: string
  description?: string
  task_type: 'cleaning' | 'cooking' | 'maintenance' | 'gardening' | 'administration' | 'other'
  hourly_rate: number
  estimated_hours?: number
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  assigned_to?: string
  assigned_date?: string
  due_date?: string
  completed_date?: string
  notes?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface ParentWorkSubmission {
  id: string
  task_id: string
  parent_id: string
  child_id?: string
  hours_worked: number
  work_date: string
  description?: string
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  approved_by?: string
  approved_at?: string
  payment_amount?: number
  payment_date?: string
  payment_method?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface ParentWorkPayment {
  id: string
  submission_id: string
  amount: number
  payment_date: string
  payment_method?: string
  transaction_id?: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  processed_by?: string
  notes?: string
  created_at: string
  updated_at: string
}

export const useParentWorkStore = defineStore('parentWork', {
  state: () => ({
    tasks: [] as ParentWorkTask[],
    submissions: [] as ParentWorkSubmission[],
    payments: [] as ParentWorkPayment[],
    loading: false,
    error: null as Error | null
  }),

  actions: {
    // Task Management
    async fetchTasks(status?: string, assignedTo?: string, kitaId?: string) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        let query = supabase.from('parent_work_tasks').select('*')

        // Add kita_id filter if provided or get from user
        if (kitaId) {
          query = query.eq('kita_id', kitaId)
        } else {
          const { getUserKitaId } = useKita()
          const userKitaId = await getUserKitaId()
          if (userKitaId) {
            query = query.eq('kita_id', userKitaId)
          }
        }

        if (status) {
          query = query.eq('status', status)
        }

        if (assignedTo) {
          query = query.eq('assigned_to', assignedTo)
        }

        query = query.order('created_at', { ascending: false })

        const { data, error } = await query

        if (error) throw error
        this.tasks = data || []
      } catch (e: any) {
        this.error = e
        console.error('Error fetching parent work tasks:', e)
      } finally {
        this.loading = false
      }
    },

    async fetchTaskById(taskId: string) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('parent_work_tasks')
          .select('*')
          .eq('id', taskId)
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error fetching task:', e)
        throw e
      }
    },

    async createTask(taskData: Partial<ParentWorkTask>) {
      try {
        const supabase = useSupabaseClient()
        const authStore = useAuthStore()
        
        // Get kita_id if not provided
        if (!taskData.kita_id) {
          const { getUserKitaId } = useKita()
          const kitaId = await getUserKitaId()
          if (kitaId) {
            taskData.kita_id = kitaId
          }
        }

        const { data, error } = await supabase
          .from('parent_work_tasks')
          .insert([{
            ...taskData,
            created_by: authStore.user?.id
          }])
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error creating task:', e)
        throw e
      }
    },

    async updateTask(taskId: string, taskData: Partial<ParentWorkTask>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('parent_work_tasks')
          .update(taskData)
          .eq('id', taskId)
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error updating task:', e)
        throw e
      }
    },

    async deleteTask(taskId: string) {
      try {
        const supabase = useSupabaseClient()
        const { error } = await supabase
          .from('parent_work_tasks')
          .delete()
          .eq('id', taskId)

        if (error) throw error
      } catch (e: any) {
        console.error('Error deleting task:', e)
        throw e
      }
    },

    // Submission Management
    async fetchSubmissions(taskId?: string, parentId?: string, kitaId?: string) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        
        // If kitaId provided or we need to filter by kita, join with tasks
        const needsKitaFilter = !taskId && !parentId && (kitaId !== undefined)
        
        let query
        if (needsKitaFilter) {
          // Join with parent_work_tasks to filter by kita_id
          query = supabase
            .from('parent_work_submissions')
            .select('*, parent_work_tasks!inner(kita_id)')
          
          // Get user's kita_id if not provided
          let targetKitaId = kitaId
          if (targetKitaId === undefined) {
            const { getUserKitaId } = useKita()
            targetKitaId = await getUserKitaId()
          }
          
          if (targetKitaId) {
            query = query.eq('parent_work_tasks.kita_id', targetKitaId)
          }
        } else {
          query = supabase.from('parent_work_submissions').select('*')
        }

        if (taskId) {
          query = query.eq('task_id', taskId)
        }

        if (parentId) {
          query = query.eq('parent_id', parentId)
        }

        query = query.order('work_date', { ascending: false })

        const { data, error } = await query

        if (error) throw error
        
        // Clean up the data structure if we joined with tasks
        this.submissions = (data || []).map((item: any) => {
          const { parent_work_tasks, ...submission } = item
          return submission
        })
      } catch (e: any) {
        this.error = e
        console.error('Error fetching submissions:', e)
      } finally {
        this.loading = false
      }
    },

    async createSubmission(submissionData: Partial<ParentWorkSubmission>) {
      try {
        const supabase = useSupabaseClient()
        const authStore = useAuthStore()

        const { data, error } = await supabase
          .from('parent_work_submissions')
          .insert([{
            ...submissionData,
            parent_id: submissionData.parent_id || authStore.user?.id
          }])
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error creating submission:', e)
        throw e
      }
    },

    async updateSubmission(submissionId: string, submissionData: Partial<ParentWorkSubmission>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('parent_work_submissions')
          .update(submissionData)
          .eq('id', submissionId)
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error updating submission:', e)
        throw e
      }
    },

    async approveSubmission(submissionId: string) {
      try {
        const supabase = useSupabaseClient()
        const authStore = useAuthStore()

        const { data, error } = await supabase
          .from('parent_work_submissions')
          .update({
            status: 'approved',
            approved_by: authStore.user?.id,
            approved_at: new Date().toISOString()
          })
          .eq('id', submissionId)
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error approving submission:', e)
        throw e
      }
    },

    async rejectSubmission(submissionId: string, reason?: string) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('parent_work_submissions')
          .update({
            status: 'rejected',
            notes: reason
          })
          .eq('id', submissionId)
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error rejecting submission:', e)
        throw e
      }
    },

    // Payment Management
    async fetchPayments(submissionId?: string) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        let query = supabase.from('parent_work_payments').select('*')

        if (submissionId) {
          query = query.eq('submission_id', submissionId)
        }

        query = query.order('payment_date', { ascending: false })

        const { data, error } = await query

        if (error) throw error
        this.payments = data || []
      } catch (e: any) {
        this.error = e
        console.error('Error fetching payments:', e)
      } finally {
        this.loading = false
      }
    },

    async createPayment(paymentData: Partial<ParentWorkPayment>) {
      try {
        const supabase = useSupabaseClient()
        const authStore = useAuthStore()

        const { data, error } = await supabase
          .from('parent_work_payments')
          .insert([{
            ...paymentData,
            processed_by: authStore.user?.id
          }])
          .select()
          .single()

        if (error) throw error

        // Update submission status to paid
        if (paymentData.submission_id) {
          await supabase
            .from('parent_work_submissions')
            .update({ status: 'paid', payment_date: paymentData.payment_date })
            .eq('id', paymentData.submission_id)
        }

        return data
      } catch (e: any) {
        console.error('Error creating payment:', e)
        throw e
      }
    },

    async getTotalEarnings(parentId: string, startDate?: string, endDate?: string) {
      try {
        const supabase = useSupabaseClient()
        let query = supabase
          .from('parent_work_submissions')
          .select('payment_amount')
          .eq('parent_id', parentId)
          .eq('status', 'paid')

        if (startDate) {
          query = query.gte('work_date', startDate)
        }

        if (endDate) {
          query = query.lte('work_date', endDate)
        }

        const { data, error } = await query

        if (error) throw error

        const total = (data || []).reduce((sum, s) => sum + (s.payment_amount || 0), 0)
        return total
      } catch (e: any) {
        console.error('Error calculating total earnings:', e)
        throw e
      }
    }
  }
})
