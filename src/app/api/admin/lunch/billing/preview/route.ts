import { NextResponse } from 'next/server'
import { getAdminClient, requireTenantRole } from '@/utils/authz/tenantGuard'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const month = Number(url.searchParams.get('month'))
    const year = Number(url.searchParams.get('year'))

    if (!month || !year || month < 1 || month > 12) {
      return NextResponse.json({ success: false, message: 'Invalid month or year' }, { status: 400 })
    }

    const { kitaId } = await requireTenantRole('admin')
    const supabaseAdmin = getAdminClient()

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    // Get active children (keeps parity with the Nuxt implementation)
    const { data: children, error: childrenError } = await supabaseAdmin
      .from('children')
      .select('id, first_name, last_name, group_id')
      .eq('status', 'active')
      .eq('kita_id', kitaId)

    if (childrenError) throw childrenError

    const previewData: any = {
      month,
      year,
      totalChildren: children?.length || 0,
      children: [],
      summary: {
        totalBillableDays: 0,
        totalRefundableDays: 0,
        estimatedTotal: 0,
        estimatedRefund: 0,
      },
    }

    for (const child of children || []) {
      const childPreview: any = {
        childId: child.id,
        childName: `${child.first_name} ${child.last_name}`,
        groupId: child.group_id,
        days: [],
        billableDays: 0,
        refundableDays: 0,
        estimatedAmount: 0,
        estimatedRefund: 0,
      }

      const { data: priceData } = await supabaseAdmin.rpc('get_group_lunch_price', {
        p_group_id: child.group_id,
        p_date: startDate.toISOString().split('T')[0],
      })

      const mealPrice = priceData || 0

      let currentDate = new Date(startDate)
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0]
        const dayOfWeek = currentDate.getDay()

        const { data: isBillableDay } = await supabaseAdmin.rpc('is_billable_day', {
          p_group_id: child.group_id,
          p_date: dateStr,
        })

        if (isBillableDay) {
          const { data: orderData } = await supabaseAdmin
            .from('lunch_orders')
            .select('id, menu_id, lunch_menus!inner(date)')
            .eq('child_id', child.id)
            .eq('lunch_menus.date', dateStr)
            .neq('status', 'cancelled')
            .limit(1)

          const hasOrder = orderData && orderData.length > 0

          const { data: absence } = await supabaseAdmin
            .from('absence_notifications')
            .select('id, deadline_met')
            .eq('child_id', child.id)
            .eq('absence_date', dateStr)
            .eq('deadline_met', true)
            .single()

          const { data: attendanceData } = await supabaseAdmin
            .from('attendance')
            .select('status')
            .eq('child_id', child.id)
            .eq('date', dateStr)
            .single()

          const wasPresent = attendanceData?.status === 'present'

          const dayInfo: any = {
            date: dateStr,
            dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
            hasOrder,
            hasInformedAbsence: !!absence,
            wasPresent,
            mealPrice,
            billable: hasOrder || (!absence && (wasPresent || !attendanceData)),
            refundable: !!absence && absence.deadline_met,
          }

          if (dayInfo.billable) {
            childPreview.billableDays++
            childPreview.estimatedAmount += mealPrice
            previewData.summary.totalBillableDays++
            previewData.summary.estimatedTotal += mealPrice
          } else if (dayInfo.refundable) {
            childPreview.refundableDays++
            childPreview.estimatedRefund += mealPrice
            previewData.summary.totalRefundableDays++
            previewData.summary.estimatedRefund += mealPrice
          }

          childPreview.days.push(dayInfo)
        }

        currentDate.setDate(currentDate.getDate() + 1)
      }

      previewData.children.push(childPreview)
    }

    return NextResponse.json({ success: true, preview: previewData })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to generate preview' },
      { status: error?.status || error?.statusCode || 500 },
    )
  }
}

