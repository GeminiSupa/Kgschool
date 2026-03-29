import { NextResponse } from 'next/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { createClient as createSupabaseServerClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const month = Number(body?.month)
    const year = Number(body?.year)
    const child_ids = body?.child_ids

    if (!month || !year) {
      return NextResponse.json({ success: false, message: 'Month and year are required' }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, message: 'Server configuration error: Missing Supabase credentials' },
        { status: 500 },
      )
    }

    // Get authenticated user to determine kita_id.
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Get user's kita_id from organization_members.
    let userKitaId: string | null = null
    const { data: memberData } = await supabaseAdmin
      .from('organization_members')
      .select('kita_id')
      .eq('profile_id', user.id)
      .not('kita_id', 'is', null)
      .limit(1)
      .single()

    if (memberData) userKitaId = memberData.kita_id

    // Get all active children (or specific children if provided).
    let childrenQuery = supabaseAdmin
      .from('children')
      .select('id, group_id, kita_id, parent_ids')
      .eq('status', 'active')

    if (userKitaId) childrenQuery = childrenQuery.eq('kita_id', userKitaId)

    if (child_ids && Array.isArray(child_ids) && child_ids.length > 0) {
      childrenQuery = childrenQuery.in('id', child_ids)
    }

    const { data: children, error: childrenError } = await childrenQuery
    if (childrenError) throw childrenError
    if (!children || children.length === 0) {
      return NextResponse.json({ success: false, message: 'No active children found' }, { status: 400 })
    }

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)
    const dueDate = new Date(year, month, 15) // Due date is 15th of next month

    const generatedBills: any[] = []

    for (const child of children) {
      // Check if billing already exists for this child/month/year.
      const { data: existingBill } = await supabaseAdmin
        .from('monthly_billing')
        .select('id')
        .eq('child_id', child.id)
        .eq('month', month)
        .eq('year', year)
        .single()

      if (existingBill) continue

      // Get child's contract to determine billing type.
      const { data: contract } = await supabaseAdmin
        .from('child_contracts')
        .select('*')
        .eq('child_id', child.id)
        .eq('status', 'active')
        .lte('start_date', endDate.toISOString().split('T')[0])
        .or(`end_date.is.null,end_date.gte.${startDate.toISOString().split('T')[0]}`)
        .order('start_date', { ascending: false })
        .limit(1)
        .single()

      // Get lunch settings for the kita (for cancellation deadlines).
      let lunchSettings: any = null
      if (child.kita_id) {
        const { data: settings } = await supabaseAdmin
          .from('lunch_settings')
          .select('*')
          .eq('kita_id', child.kita_id)
          .single()
        lunchSettings = settings
      }

      // Determine billing type from contract or default to per_meal.
      const billingType = contract?.lunch_billing_type || 'per_meal'
      const flatRateAmount = contract?.lunch_flat_rate_amount || null

      // For flat_monthly billing, create single item.
      if (billingType === 'flat_monthly' && flatRateAmount) {
        const { data: billing, error: billingError } = await supabaseAdmin
          .from('monthly_billing')
          .insert([
            {
              child_id: child.id,
              month,
              year,
              total_amount: parseFloat(flatRateAmount.toString()),
              paid_amount: 0,
              refund_amount: 0,
              status: 'pending',
              billing_date: startDate.toISOString().split('T')[0],
              due_date: dueDate.toISOString().split('T')[0],
            },
          ])
          .select()
          .single()

        if (!billingError && billing) {
          await supabaseAdmin.from('lunch_billing_items').insert([
            {
              billing_id: billing.id,
              order_id: null,
              date: startDate.toISOString().split('T')[0],
              meal_price: parseFloat(flatRateAmount.toString()),
              is_informed_absence: false,
              is_refundable: false,
              refunded: false,
              billing_reason: 'flat_rate_allocation',
              notes: 'Monthly flat rate',
            },
          ])

          generatedBills.push(billing)
        }
        continue
      }

      // For per_meal or hybrid billing, calculate day by day.
      let totalAmount = 0
      let refundAmount = 0
      const billingItems: any[] = []
      let currentDate = new Date(startDate)

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0]
        const dayOfWeek = currentDate.getDay() // 0=Sunday, 1=Monday, ..., 6=Saturday

        // Check if this day is billable for the group using timetable.
        let shouldBill = true
        try {
          const { data: isBillableDay, error: timetableError } = await supabaseAdmin.rpc('is_billable_day', {
            p_group_id: child.group_id,
            p_date: dateStr,
          })

          if (timetableError) {
            shouldBill = dayOfWeek !== 0 && dayOfWeek !== 6
          } else {
            shouldBill = isBillableDay === true
          }
        } catch {
          shouldBill = dayOfWeek !== 0 && dayOfWeek !== 6
        }

        if (shouldBill) {
          // Check for lunch order.
          const { data: orderData } = await supabaseAdmin
            .from('lunch_orders')
            .select('id, menu_id, cancelled_at, lunch_menus!inner(date)')
            .eq('child_id', child.id)
            .eq('lunch_menus.date', dateStr)
            .neq('status', 'cancelled')
            .limit(1)

          const order = orderData && orderData.length > 0 ? orderData[0] : null

          // Check for absence notification with cancellation deadline check.
          const { data: absence } = await supabaseAdmin
            .from('absence_notifications')
            .select('id, notified_at, deadline_met')
            .eq('child_id', child.id)
            .eq('absence_date', dateStr)
            .single()

          // Check cancellation deadline.
          let cancellationDeadlineMet = false
          let cancellationTimestamp: string | null = null

          if (lunchSettings && absence) {
            const deadlineTime = lunchSettings.cancellation_deadline_time || '08:00:00'
            const graceMinutes = lunchSettings.grace_minutes || 0

            const [hours, minutes] = deadlineTime.split(':').map(Number)
            const deadlineDateTime = new Date(currentDate)
            deadlineDateTime.setHours(hours, minutes + graceMinutes, 0, 0)

            const notifiedAt = new Date(absence.notified_at)
            cancellationDeadlineMet = notifiedAt < deadlineDateTime
            cancellationTimestamp = absence.notified_at
          } else if (absence) {
            cancellationDeadlineMet = absence.deadline_met || false
            cancellationTimestamp = absence.notified_at
          }

          // Check if order was cancelled and when.
          if (order?.cancelled_at) {
            const cancelledAt = new Date(order.cancelled_at)
            if (lunchSettings) {
              const deadlineTime = lunchSettings.cancellation_deadline_time || '08:00:00'
              const [hours, minutes] = deadlineTime.split(':').map(Number)
              const deadlineDateTime = new Date(currentDate)
              deadlineDateTime.setHours(hours, minutes + (lunchSettings.grace_minutes || 0), 0, 0)

              cancellationDeadlineMet = cancelledAt < deadlineDateTime
              cancellationTimestamp = order.cancelled_at
            }
          }

          // Get price for the group.
          let mealPrice = 0
          try {
            const { data: priceData, error: priceError } = await supabaseAdmin.rpc('get_group_lunch_price', {
              p_group_id: child.group_id,
              p_date: dateStr,
            })

            if (priceError) {
              const { data: groupData } = await supabaseAdmin
                .from('groups')
                .select('lunch_price_per_meal')
                .eq('id', child.group_id)
                .single()

              mealPrice = groupData?.lunch_price_per_meal || 0

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
          } catch {
            mealPrice = 0
          }

          // Check attendance.
          const { data: attendanceData } = await supabaseAdmin
            .from('attendance')
            .select('status')
            .eq('child_id', child.id)
            .eq('date', dateStr)
            .single()

          const wasPresent = attendanceData?.status === 'present'

          // Determine billing reason and if billable.
          let isBillable = false
          let billingReason = 'uninformed_absence'
          let notes = ''

          if (order && !order.cancelled_at) {
            isBillable = true
            billingReason = 'ordered'
            notes = 'Lunch ordered'
          } else if (order?.cancelled_at) {
            if (!cancellationDeadlineMet) {
              isBillable = true
              billingReason = 'cancellation_after_deadline'
              notes = `Cancelled after deadline (${cancellationTimestamp})`
            } else {
              isBillable = false
              billingReason = 'cancelled_before_deadline'
              notes = `Cancelled before deadline (${cancellationTimestamp})`
            }
          } else if (wasPresent) {
            isBillable = true
            billingReason = 'present'
            notes = 'Present (attendance)'
          } else if (absence && cancellationDeadlineMet) {
            isBillable = false
            billingReason = 'informed_absence'
            notes = `Informed absence before deadline (${cancellationTimestamp})`
          } else {
            isBillable = true
            billingReason = 'uninformed_absence'
            notes = absence ? 'Absent without notification' : 'No attendance record'
          }

          if (isBillable) {
            totalAmount += mealPrice
            billingItems.push({
              date: dateStr,
              meal_price: mealPrice,
              billing_reason: billingReason,
              cancellation_deadline_met: cancellationDeadlineMet,
              cancellation_timestamp: cancellationTimestamp,
              notes,
              order_id: order?.id || null,
            })
          } else if (absence && cancellationDeadlineMet) {
            refundAmount += mealPrice
            billingItems.push({
              date: dateStr,
              meal_price: mealPrice,
              billing_reason: 'informed_absence',
              is_informed_absence: true,
              is_refundable: true,
              cancellation_deadline_met: true,
              cancellation_timestamp: cancellationTimestamp,
              notes: `Informed absence - refundable`,
              order_id: null,
            })
          }
        }

        currentDate.setDate(currentDate.getDate() + 1)
      }

      const finalAmount = totalAmount - refundAmount

      const { data: billing, error: billingError } = await supabaseAdmin
        .from('monthly_billing')
        .insert([
          {
            child_id: child.id,
            month,
            year,
            total_amount: finalAmount,
            paid_amount: 0,
            refund_amount: refundAmount,
            status: 'pending',
            billing_date: startDate.toISOString().split('T')[0],
            due_date: dueDate.toISOString().split('T')[0],
          },
        ])
        .select()
        .single()

      if (billingError) continue

      for (const item of billingItems) {
        const { data: billingItem, error: itemError } = await supabaseAdmin
          .from('lunch_billing_items')
          .insert([
            {
              billing_id: billing.id,
              order_id: item.order_id,
              date: item.date,
              meal_price: item.meal_price,
              is_informed_absence: item.is_informed_absence || false,
              is_refundable: item.is_refundable || false,
              refunded: false,
              cancellation_deadline_met: item.cancellation_deadline_met,
              cancellation_timestamp: item.cancellation_timestamp,
              billing_reason: item.billing_reason,
              notes: item.notes,
            },
          ])
          .select()
          .single()

        if (!itemError && item.order_id && billingItem) {
          await supabaseAdmin
            .from('lunch_orders')
            .update({ billing_item_id: billingItem.id })
            .eq('id', item.order_id)
        }
      }

      generatedBills.push(billing)
    }

    return NextResponse.json({
      success: true,
      count: generatedBills.length,
      bills: generatedBills,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate billing'
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}

