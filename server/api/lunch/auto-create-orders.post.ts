import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const supabaseUrl = config.public.supabaseUrl
    const supabaseServiceKey = config.supabaseServiceKey

    if (!supabaseUrl || !supabaseServiceKey) {
      throw createError({
        statusCode: 500,
        message: 'Supabase configuration missing'
      })
    }

    // Create admin client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get today's date
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    // Get today's menu
    const { data: menu, error: menuError } = await supabase
      .from('lunch_menus')
      .select('id')
      .eq('date', todayStr)
      .single()

    if (menuError || !menu) {
      return {
        success: false,
        message: `No menu found for date ${todayStr}`,
        created: 0
      }
    }

    // Get all active children
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select('id')
      .eq('status', 'active')

    if (childrenError) {
      throw createError({
        statusCode: 500,
        message: `Error fetching children: ${childrenError.message}`
      })
    }

    if (!children || children.length === 0) {
      return {
        success: true,
        message: 'No active children found',
        created: 0
      }
    }

    const childIds = children.map(c => c.id)
    const createdOrders = []
    const updatedOrders = []

    // Process each child
    for (const childId of childIds) {
      // Check if order already exists
      const { data: existingOrder, error: orderError } = await supabase
        .from('lunch_orders')
        .select('id, cancelled_at, status')
        .eq('child_id', childId)
        .eq('menu_id', menu.id)
        .single()

      if (orderError && orderError.code !== 'PGRST116') {
        // Error other than "not found"
        console.error(`Error checking order for child ${childId}:`, orderError)
        continue
      }

      if (!existingOrder) {
        // No order exists, create auto-order
        const { data: newOrder, error: createError } = await supabase
          .from('lunch_orders')
          .insert({
            child_id: childId,
            menu_id: menu.id,
            order_date: todayStr,
            status: 'confirmed',
            auto_created: true,
            deadline_passed: true
          })
          .select()
          .single()

        if (!createError && newOrder) {
          createdOrders.push(newOrder)
        } else if (createError) {
          console.error(`Error creating order for child ${childId}:`, createError)
        }
      } else if (existingOrder && !existingOrder.cancelled_at && existingOrder.status !== 'cancelled') {
        // Order exists and wasn't cancelled, mark deadline as passed
        const { error: updateError } = await supabase
          .from('lunch_orders')
          .update({ deadline_passed: true })
          .eq('id', existingOrder.id)

        if (!updateError) {
          updatedOrders.push(existingOrder.id)
        }
      }
    }

    return {
      success: true,
      message: `Processed ${childIds.length} children`,
      created: createdOrders.length,
      updated: updatedOrders.length,
      date: todayStr
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to auto-create orders'
    })
  }
})
