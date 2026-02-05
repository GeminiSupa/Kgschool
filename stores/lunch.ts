import { defineStore } from 'pinia'
import { useKita } from '~/composables/useKita'

export interface LunchMenu {
  id: string
  date: string
  meal_name: string
  description?: string
  allergens: string[]
  nutritional_info: Record<string, any>
  photo_url?: string
  created_at: string
}

export interface LunchOrder {
  id: string
  child_id: string
  menu_id: string
  order_date: string
  status: 'pending' | 'confirmed' | 'prepared' | 'served' | 'cancelled'
  special_requests?: string
  auto_created?: boolean
  cancelled_at?: string
  cancelled_by?: string
  deadline_passed?: boolean
  created_at: string
}

export const useLunchStore = defineStore('lunch', {
  state: () => ({
    menus: [] as LunchMenu[],
    orders: [] as LunchOrder[],
    todayMenu: null as LunchMenu | null,
    loading: false,
    error: null as Error | null
  }),

  actions: {
    async fetchMenus(startDate?: string, endDate?: string, kitaId?: string) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        let query = supabase.from('lunch_menus').select('*').order('date', { ascending: false })

        // Add kita_id filter if provided or get from user
        if (kitaId) {
          query = query.eq('kita_id', kitaId)
        } else {
          // Try to get user's kita_id
          const { getUserKitaId } = useKita()
          const userKitaId = await getUserKitaId()
          if (userKitaId) {
            query = query.eq('kita_id', userKitaId)
          }
        }

        if (startDate) {
          query = query.gte('date', startDate)
        }
        if (endDate) {
          query = query.lte('date', endDate)
        }

        const { data, error } = await query

        if (error) throw error
        this.menus = data || []
      } catch (e: any) {
        this.error = e
        console.error('Error fetching menus:', e)
      } finally {
        this.loading = false
      }
    },

    async fetchTodayMenu(kitaId?: string) {
      try {
        const supabase = useSupabaseClient()
        const today = new Date().toISOString().split('T')[0]
        let query = supabase
          .from('lunch_menus')
          .select('*')
          .eq('date', today)

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

        const { data, error } = await query.single()

        if (error && error.code !== 'PGRST116') throw error
        this.todayMenu = data
      } catch (e: any) {
        console.error('Error fetching today menu:', e)
      }
    },

    async fetchOrders(childId?: string, menuId?: string, kitaId?: string) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        
        // If kitaId provided or we need to filter by kita, join with children
        const needsKitaFilter = !childId && (kitaId !== undefined)
        
        let query
        if (needsKitaFilter) {
          // Join with children to filter by kita_id
          query = supabase
            .from('lunch_orders')
            .select('*, children!inner(kita_id)')
          
          // Get user's kita_id if not provided
          let targetKitaId = kitaId
          if (targetKitaId === undefined) {
            const { getUserKitaId } = useKita()
            targetKitaId = await getUserKitaId()
          }
          
          if (targetKitaId) {
            query = query.eq('children.kita_id', targetKitaId)
          }
        } else {
          query = supabase.from('lunch_orders').select('*')
        }

        query = query.order('order_date', { ascending: false })

        if (childId) {
          query = query.eq('child_id', childId)
        }
        if (menuId) {
          query = query.eq('menu_id', menuId)
        }

        const { data, error } = await query

        if (error) throw error
        
        // Clean up the data structure if we joined with children
        this.orders = (data || []).map((item: any) => {
          const { children, ...order } = item
          return order
        })
      } catch (e: any) {
        this.error = e
        console.error('Error fetching orders:', e)
      } finally {
        this.loading = false
      }
    },

    async createMenu(menuData: Partial<LunchMenu>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('lunch_menus')
          .insert([menuData])
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error creating menu:', e)
        throw e
      }
    },

    async updateMenu(menuId: string, menuData: Partial<LunchMenu>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('lunch_menus')
          .update(menuData)
          .eq('id', menuId)
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error updating menu:', e)
        throw e
      }
    },

    async deleteMenu(menuId: string) {
      try {
        const supabase = useSupabaseClient()
        const { error } = await supabase
          .from('lunch_menus')
          .delete()
          .eq('id', menuId)

        if (error) throw error
      } catch (e: any) {
        console.error('Error deleting menu:', e)
        throw e
      }
    },

    async createOrder(orderData: Partial<LunchOrder>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('lunch_orders')
          .insert([orderData])
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error creating order:', e)
        throw e
      }
    },

    async cancelOrder(orderId: string) {
      try {
        const supabase = useSupabaseClient()
        const authStore = useAuthStore()
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const deadline = new Date(today)
        deadline.setHours(8, 0, 0, 0)

        // Check if deadline has passed
        if (now >= deadline) {
          throw new Error('Cannot cancel after 8 AM deadline')
        }

        // Get the order to check its date
        const { data: order } = await supabase
          .from('lunch_orders')
          .select('order_date')
          .eq('id', orderId)
          .single()

        if (!order) {
          throw new Error('Order not found')
        }

        const orderDate = new Date(order.order_date)
        const orderDeadline = new Date(orderDate)
        orderDeadline.setHours(8, 0, 0, 0)

        // Check if deadline for this order has passed
        if (now >= orderDeadline) {
          throw new Error('Cannot cancel after 8 AM deadline')
        }

        // Cancel the order
        const { data, error } = await supabase
          .from('lunch_orders')
          .update({
            status: 'cancelled',
            cancelled_at: now.toISOString(),
            cancelled_by: authStore.user?.id
          })
          .eq('id', orderId)
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error cancelling order:', e)
        throw e
      }
    },

    async autoCreateOrdersForDate(date: string, kitaId?: string) {
      try {
        const supabase = useSupabaseClient()
        
        // Get user's kita_id if not provided
        let targetKitaId = kitaId
        if (!targetKitaId) {
          const { getUserKitaId } = useKita()
          targetKitaId = await getUserKitaId()
        }
        
        // Get today's menu (filtered by kita_id if available)
        let menuQuery = supabase
          .from('lunch_menus')
          .select('id')
          .eq('date', date)
        
        if (targetKitaId) {
          menuQuery = menuQuery.eq('kita_id', targetKitaId)
        }
        
        const { data: menu } = await menuQuery.single()

        if (!menu) {
          console.log(`No menu found for date ${date}`)
          return []
        }

        // Get all active children (filtered by kita_id if available)
        let childrenQuery = supabase
          .from('children')
          .select('id')
          .eq('status', 'active')
        
        if (targetKitaId) {
          childrenQuery = childrenQuery.eq('kita_id', targetKitaId)
        }
        
        const { data: children } = await childrenQuery

        if (!children || children.length === 0) {
          return []
        }

        const childIds = children.map(c => c.id)
        const createdOrders = []

        // Check each child
        for (const childId of childIds) {
          // Check if order already exists
          const { data: existingOrder } = await supabase
            .from('lunch_orders')
            .select('id, cancelled_at')
            .eq('child_id', childId)
            .eq('menu_id', menu.id)
            .single()

          // If no order exists or order was cancelled, create auto-order
          if (!existingOrder || existingOrder.cancelled_at) {
            const { data: newOrder, error } = await supabase
              .from('lunch_orders')
              .upsert({
                child_id: childId,
                menu_id: menu.id,
                order_date: date,
                status: 'confirmed',
                auto_created: true,
                deadline_passed: true
              }, {
                onConflict: 'child_id,menu_id'
              })
              .select()
              .single()

            if (!error && newOrder) {
              createdOrders.push(newOrder)
            }
          } else if (existingOrder && !existingOrder.cancelled_at) {
            // Mark existing order as deadline passed if not cancelled
            await supabase
              .from('lunch_orders')
              .update({ deadline_passed: true })
              .eq('id', existingOrder.id)
          }
        }

        return createdOrders
      } catch (e: any) {
        console.error('Error auto-creating orders:', e)
        throw e
      }
    },

    getBillableOrders(childId: string, startDate: string, endDate: string) {
      return this.orders.filter(order => {
        // Must be for the specified child
        if (order.child_id !== childId) return false

        // Must be within date range
        const orderDate = new Date(order.order_date)
        const start = new Date(startDate)
        const end = new Date(endDate)
        if (orderDate < start || orderDate > end) return false

        // Must be billable: confirmed, prepared, served, or auto-created
        // Exclude cancelled orders
        if (order.status === 'cancelled') return false
        if (order.status === 'pending' && !order.auto_created) return false

        return true
      })
    }
  }
})
