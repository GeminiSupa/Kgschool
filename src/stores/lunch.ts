import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'
import { toUserErrorMessage } from '@/utils/errors/toUserErrorMessage'

export interface LunchMenu {
  id: string
  date: string
  meal_name: string
  description?: string
  allergens: string[]
  nutritional_info: Record<string, any>
  photo_url?: string
  created_at: string
  kita_id?: string
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

interface LunchState {
  menus: LunchMenu[]
  orders: LunchOrder[]
  todayMenu: LunchMenu | null
  loading: boolean
  error: Error | null
  fetchMenus: (startDate?: string, endDate?: string, kitaId?: string) => Promise<void>
  fetchTodayMenu: (kitaId?: string) => Promise<void>
  fetchOrders: (childId?: string, menuId?: string, kitaId?: string) => Promise<void>
  createMenu: (menuData: Partial<LunchMenu>) => Promise<LunchMenu>
  updateMenu: (menuId: string, menuData: Partial<LunchMenu>) => Promise<LunchMenu>
  deleteMenu: (menuId: string) => Promise<void>
  createOrder: (orderData: Partial<LunchOrder>) => Promise<LunchOrder>
  cancelOrder: (orderId: string, userId: string) => Promise<LunchOrder>
}

export const useLunchStore = create<LunchState>((set, get) => ({
  menus: [],
  orders: [],
  todayMenu: null,
  loading: false,
  error: null,

  fetchMenus: async (startDate, endDate, kitaId) => {
    set({ loading: true, error: null })
    try {
      const supabase = createClient()
      let query = supabase.from('lunch_menus').select('*').order('date', { ascending: false })

      if (kitaId) {
        query = query.eq('kita_id', kitaId)
      }
      if (startDate) {
        query = query.gte('date', startDate)
      }
      if (endDate) {
        query = query.lte('date', endDate)
      }

      const { data, error } = await query
      if (error) throw error
      set({ menus: data || [] })
    } catch (e: any) {
      const msg = toUserErrorMessage(e, 'Fehler beim Laden des Speiseplans.')
      set({ error: new Error(msg) })
    } finally {
      set({ loading: false })
    }
  },

  fetchTodayMenu: async (kitaId) => {
    try {
      const supabase = createClient()
      const today = new Date().toISOString().split('T')[0]
      let query = supabase.from('lunch_menus').select('*').eq('date', today)

      if (kitaId) {
        query = query.eq('kita_id', kitaId)
      }

      const { data, error } = await query.single()
      if (error && error.code !== 'PGRST116') throw error
      set({ todayMenu: data })
    } catch (e: any) {
      // swallow; dashboards show "no menu" state
    }
  },

  fetchOrders: async (childId, menuId, kitaId) => {
    set({ loading: true, error: null })
    try {
      const supabase = createClient()
      let query = supabase.from('lunch_orders').select('*')

      if (childId) query = query.eq('child_id', childId)
      if (menuId) query = query.eq('menu_id', menuId)
      
      query = query.order('order_date', { ascending: false })

      const { data, error } = await query
      if (error) throw error
      set({ orders: data || [] })
    } catch (e: any) {
      const msg = toUserErrorMessage(e, 'Fehler beim Laden der Bestellungen.')
      set({ error: new Error(msg) })
    } finally {
      set({ loading: false })
    }
  },

  createMenu: async (menuData) => {
    try {
      const supabase = createClient()
      const payload: Partial<LunchMenu> = {
        date: menuData.date,
        meal_name: menuData.meal_name,
        description: menuData.description,
        allergens: menuData.allergens ?? [],
        nutritional_info: menuData.nutritional_info ?? {},
        photo_url: menuData.photo_url,
        kita_id: menuData.kita_id,
      }

      const { data, error } = await supabase
        .from('lunch_menus')
        .insert([payload])
        .select()
        .single()

      if (error) throw error
      return data as LunchMenu
    } catch (e: unknown) {
      throw new Error(toUserErrorMessage(e, 'Menü konnte nicht erstellt werden.'))
    }
  },

  updateMenu: async (menuId, menuData) => {
    try {
      const supabase = createClient()
      const payload: Partial<LunchMenu> = {
        date: menuData.date,
        meal_name: menuData.meal_name,
        description: menuData.description,
        allergens: menuData.allergens ?? [],
        nutritional_info: menuData.nutritional_info ?? {},
        photo_url: menuData.photo_url,
        kita_id: menuData.kita_id,
      }

      const { data, error } = await supabase
        .from('lunch_menus')
        .update(payload)
        .eq('id', menuId)
        .select()
        .single()

      if (error) throw error
      return data as LunchMenu
    } catch (e: unknown) {
      throw new Error(toUserErrorMessage(e, 'Menü konnte nicht gespeichert werden.'))
    }
  },

  deleteMenu: async (menuId) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from('lunch_menus').delete().eq('id', menuId)
      if (error) throw error
    } catch (e: unknown) {
      throw new Error(toUserErrorMessage(e, 'Menü konnte nicht gelöscht werden.'))
    }
  },

  createOrder: async (orderData) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('lunch_orders')
        .insert([orderData])
        .select()
        .single()
      if (error) throw error
      return data as LunchOrder
    } catch (e: any) {
      throw new Error(toUserErrorMessage(e, 'Bestellung konnte nicht erstellt werden.'))
    }
  },

  cancelOrder: async (orderId, userId) => {
    try {
      const supabase = createClient()
      const now = new Date()
      
      const { data, error } = await supabase
        .from('lunch_orders')
        .update({
          status: 'cancelled',
          cancelled_at: now.toISOString(),
          cancelled_by: userId
        })
        .eq('id', orderId)
        .select()
        .single()

      if (error) throw error
      return data as LunchOrder
    } catch (e: any) {
      throw new Error(toUserErrorMessage(e, 'Bestellung konnte nicht storniert werden.'))
    }
  }
}))
