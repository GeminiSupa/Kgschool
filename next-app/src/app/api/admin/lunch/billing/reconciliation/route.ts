import { NextResponse } from 'next/server'
import { getAdminClient, requireTenantRole } from '@/utils/authz/tenantGuard'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const month = Number(url.searchParams.get('month'))
    const year = Number(url.searchParams.get('year'))

    if (!month || !year) {
      return NextResponse.json({ success: false, message: 'Invalid month or year' }, { status: 400 })
    }

    const { kitaId } = await requireTenantRole('admin')
    const supabaseAdmin = getAdminClient()

    const { data: bills, error: billsError } = await supabaseAdmin
      .from('monthly_billing')
      .select('*, children!inner(id, first_name, last_name, group_id, kita_id)')
      .eq('month', month)
      .eq('year', year)
      .eq('children.kita_id', kitaId)

    if (billsError) throw billsError

    const reconciliation: any = {
      month,
      year,
      summary: {
        totalBills: bills?.length || 0,
        expectedTotal: 0,
        actualTotal: 0,
        difference: 0,
      },
      bills: [],
      discrepancies: [],
      missingAttendance: [],
      missingPricing: [],
    }

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    const groupsChecked = new Set<string>()

    for (const bill of bills || []) {
      const child = (bill as any).children
      const childName = `${child.first_name} ${child.last_name}`

      const { data: calculation } = await supabaseAdmin.rpc('calculate_monthly_billing', {
        p_child_id: child.id,
        p_month: month,
        p_year: year,
      })

      const expectedAmount =
        calculation && calculation.length > 0
          ? (calculation[0].total_amount || 0) - (calculation[0].refund_amount || 0)
          : 0

      const actualAmount = bill.total_amount || 0
      const difference = actualAmount - expectedAmount

      const billInfo: any = {
        billId: bill.id,
        childId: child.id,
        childName,
        expected: expectedAmount,
        actual: actualAmount,
        difference,
      }

      reconciliation.bills.push(billInfo)
      reconciliation.summary.expectedTotal += expectedAmount
      reconciliation.summary.actualTotal += actualAmount

      if (Math.abs(difference) > 0.01) {
        let issue = 'Amount mismatch'
        if (actualAmount === 0 && expectedAmount > 0) {
          issue = 'Bill shows €0.00 but expected amount is greater'
        } else if (actualAmount > 0 && expectedAmount === 0) {
          issue = 'Bill has amount but expected is €0.00'
        }

        reconciliation.discrepancies.push({
          ...billInfo,
          issue,
        })
      }

      // Pricing check per group
      if (!groupsChecked.has(child.group_id)) {
        groupsChecked.add(child.group_id)

        const { data: priceData } = await supabaseAdmin.rpc('get_group_lunch_price', {
          p_group_id: child.group_id,
          p_date: startDate.toISOString().split('T')[0],
        })

        if (!priceData || priceData === 0) {
          const { data: groupData } = await supabaseAdmin
            .from('groups')
            .select('name')
            .eq('id', child.group_id)
            .single()

          if (!reconciliation.missingPricing.find((m: any) => m.groupId === child.group_id)) {
            reconciliation.missingPricing.push({
              groupId: child.group_id,
              groupName: groupData?.name || child.group_id,
            })
          }
        }
      }

      // Attendance “sample check” parity with Nuxt implementation.
      const { count: attendanceCount } = await supabaseAdmin
        .from('attendance')
        .select('id', { count: 'exact', head: true })
        .eq('child_id', child.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])

      if ((!attendanceCount || attendanceCount === 0) && actualAmount > 0) {
        reconciliation.missingAttendance.push({
          childId: child.id,
          childName,
          date: startDate.toISOString().split('T')[0],
          issue: 'No attendance records found for billing period',
        })
      }
    }

    reconciliation.summary.difference = reconciliation.summary.actualTotal - reconciliation.summary.expectedTotal

    return NextResponse.json({ success: true, reconciliation })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate reconciliation'
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}

