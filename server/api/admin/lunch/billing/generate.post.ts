import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { month, year, child_ids } = body

    if (!month || !year) {
      throw createError({
        statusCode: 400,
        message: 'Missing required fields: month, year'
      })
    }

    if (month < 1 || month > 12) {
      throw createError({
        statusCode: 400,
        message: 'Month must be between 1 and 12'
      })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw createError({
        statusCode: 500,
        message: 'Server configuration error: Missing Supabase credentials'
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get all active children (or specific children if provided)
    let childrenQuery = supabaseAdmin
      .from('children')
      .select('id, group_id, parent_ids')
      .eq('status', 'active')

    if (child_ids && Array.isArray(child_ids) && child_ids.length > 0) {
      childrenQuery = childrenQuery.in('id', child_ids)
    }

    const { data: children, error: childrenError } = await childrenQuery

    if (childrenError) throw childrenError
    if (!children || children.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No active children found'
      })
    }

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0) // Last day of month
    const dueDate = new Date(year, month, 15) // Due date is 15th of next month

    const generatedBills = []

    for (const child of children) {
      // Check if billing already exists for this child/month/year
      const { data: existingBill } = await supabaseAdmin
        .from('monthly_billing')
        .select('id')
        .eq('child_id', child.id)
        .eq('month', month)
        .eq('year', year)
        .single()

      if (existingBill) {
        console.log(`Billing already exists for child ${child.id}, month ${month}/${year}`)
        continue
      }

      // Calculate billing using database function
      const { data: calculation, error: calcError } = await supabaseAdmin
        .rpc('calculate_monthly_billing', {
          p_child_id: child.id,
          p_month: month,
          p_year: year
        })

      if (calcError) {
        console.error(`Error calculating billing for child ${child.id}:`, calcError)
        continue
      }

      if (!calculation || calculation.length === 0) {
        console.log(`No billing data for child ${child.id}`)
        continue
      }

      const calc = calculation[0]
      const totalAmount = calc.total_amount || 0
      const refundAmount = calc.refund_amount || 0
      const finalAmount = totalAmount - refundAmount

      // Create monthly billing record
      const { data: billing, error: billingError } = await supabaseAdmin
        .from('monthly_billing')
        .insert([{
          child_id: child.id,
          month,
          year,
          total_amount: finalAmount,
          paid_amount: 0,
          refund_amount: refundAmount,
          status: 'pending',
          billing_date: startDate.toISOString().split('T')[0],
          due_date: dueDate.toISOString().split('T')[0]
        }])
        .select()
        .single()

      if (billingError) {
        console.error(`Error creating billing for child ${child.id}:`, billingError)
        continue
      }

      // Create billing items for each day
      const billingItems = []
      let currentDate = new Date(startDate)

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0]
        const dayOfWeek = currentDate.getDay() // 0=Sunday, 1=Monday, ..., 6=Saturday
        
        // Check if this day is billable for the group using timetable
        let shouldBill = true // Default to true
        try {
          const { data: isBillableDay, error: timetableError } = await supabaseAdmin
            .rpc('is_billable_day', {
              p_group_id: child.group_id,
              p_date: dateStr
            })
          
          // If RPC fails, default to Mon-Fri (skip weekends: 0=Sunday, 6=Saturday)
          if (timetableError) {
            shouldBill = dayOfWeek !== 0 && dayOfWeek !== 6
          } else {
            shouldBill = isBillableDay === true
          }
        } catch (e) {
          // Fallback to default: Mon-Fri only
          shouldBill = dayOfWeek !== 0 && dayOfWeek !== 6
        }
        
        if (shouldBill) {

          // Check for lunch order - join with lunch_menus to check menu date
          const { data: orderData } = await supabaseAdmin
            .from('lunch_orders')
            .select('id, menu_id, lunch_menus!inner(date)')
            .eq('child_id', child.id)
            .eq('lunch_menus.date', dateStr)
            .neq('status', 'cancelled')
            .limit(1)
          
          const order = orderData && orderData.length > 0 ? orderData[0] : null

          // Check for informed absence
          const { data: absence } = await supabaseAdmin
            .from('absence_notifications')
            .select('id, deadline_met')
            .eq('child_id', child.id)
            .eq('absence_date', dateStr)
            .eq('deadline_met', true)
            .single()

          // Get price for the group
          let mealPrice = 0
          try {
            const { data: priceData, error: priceError } = await supabaseAdmin
              .rpc('get_group_lunch_price', {
                p_group_id: child.group_id,
                p_date: dateStr
              })
            
            if (priceError) {
              console.warn(`Error getting price for group ${child.group_id}:`, priceError)
              // Try direct query as fallback
              const { data: groupData } = await supabaseAdmin
                .from('groups')
                .select('lunch_price_per_meal')
                .eq('id', child.group_id)
                .single()
              
              mealPrice = groupData?.lunch_price_per_meal || 0
              
              // If still 0, check lunch_pricing table
              if (mealPrice === 0) {
                const { data: pricingData } = await supabaseAdmin
                  .from('lunch_pricing')
                  .select('price_per_meal')
                  .eq('group_id', child.group_id)
                  .lte('effective_from', dateStr)
                  .or(`effective_to.is.null,effective_to.gte.${dateStr}`)
                  .order('effective_from', { ascending: false })
                  .limit(1)
                  .single()
                
                mealPrice = pricingData?.price_per_meal || 0
              }
            } else {
              mealPrice = priceData || 0
            }
          } catch (e) {
            console.error('Error fetching price:', e)
            mealPrice = 0
          }
          
          // Warn if price is still 0
          if (mealPrice === 0) {
            console.warn(`No lunch price set for group ${child.group_id} on ${dateStr}. Please set pricing in /admin/lunch/pricing`)
          }

          // Check attendance to determine if child was present
          const { data: attendanceData } = await supabaseAdmin
            .from('attendance')
            .select('status')
            .eq('child_id', child.id)
            .eq('date', dateStr)
            .single()
          
          const wasPresent = attendanceData?.status === 'present'
          
          // Billable if: has order OR (no informed absence AND (was present OR no attendance record))
          // This means: bill if they ordered, or if they were present, or if we don't know (uninformed)
          const isBillable = order || (!absence && (wasPresent || !attendanceData))
          
          if (isBillable) {
            // Billable day (has order OR was present OR uninformed absence)
            const { data: item, error: itemError } = await supabaseAdmin
              .from('lunch_billing_items')
              .insert([{
                billing_id: billing.id,
                order_id: order?.id || null,
                date: dateStr,
                meal_price: mealPrice,
                is_informed_absence: false,
                is_refundable: false,
                refunded: false,
                notes: wasPresent ? 'Present (attendance)' : (order ? 'Lunch ordered' : 'Uninformed absence')
              }])
              .select()
              .single()

            if (!itemError && order) {
              // Update order with billing_item_id
              await supabaseAdmin
                .from('lunch_orders')
                .update({ billing_item_id: item.id })
                .eq('id', order.id)
            }
          } else if (absence && absence.deadline_met) {
            // Refundable day (informed absence before deadline)
            await supabaseAdmin
              .from('lunch_billing_items')
              .insert([{
                billing_id: billing.id,
                order_id: null,
                date: dateStr,
                meal_price: mealPrice,
                is_informed_absence: true,
                is_refundable: true,
                refunded: false
              }])
          }
        }

        currentDate.setDate(currentDate.getDate() + 1)
      }

      generatedBills.push(billing)
    }

    return {
      success: true,
      count: generatedBills.length,
      bills: generatedBills
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to generate billing'
    })
  }
})
