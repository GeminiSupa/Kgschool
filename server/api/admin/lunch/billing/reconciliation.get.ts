import { createClient } from '@supabase/supabase-js'
import { defineEventHandler, getQuery, createError } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const month = parseInt(query.month as string)
    const year = parseInt(query.year as string)

    if (!month || !year || month < 1 || month > 12) {
      throw createError({
        statusCode: 400,
        message: 'Invalid month or year'
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

    // Get all bills for the month
    const { data: bills, error: billsError } = await supabaseAdmin
      .from('monthly_billing')
      .select('*, children!inner(id, first_name, last_name, group_id)')
      .eq('month', month)
      .eq('year', year)

    if (billsError) throw billsError

    const reconciliation: any = {
      month,
      year,
      summary: {
        totalBills: bills?.length || 0,
        expectedTotal: 0,
        actualTotal: 0,
        difference: 0
      },
      bills: [] as any[],
      discrepancies: [] as any[],
      missingAttendance: [] as any[],
      missingPricing: [] as any[]
    }

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    // Track groups we've checked for pricing
    const groupsChecked = new Set<string>()

    for (const bill of bills || []) {
      const child = bill.children
      const childName = `${child.first_name} ${child.last_name}`

      // Calculate expected amount
      const { data: calculation } = await supabaseAdmin
        .rpc('calculate_monthly_billing', {
          p_child_id: child.id,
          p_month: month,
          p_year: year
        })

      const expectedAmount = calculation && calculation.length > 0
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
        difference
      }

      reconciliation.bills.push(billInfo)
      reconciliation.summary.expectedTotal += expectedAmount
      reconciliation.summary.actualTotal += actualAmount

      // Check for discrepancies
      if (Math.abs(difference) > 0.01) {
        let issue = 'Amount mismatch'
        if (actualAmount === 0 && expectedAmount > 0) {
          issue = 'Bill shows €0.00 but expected amount is greater'
        } else if (actualAmount > 0 && expectedAmount === 0) {
          issue = 'Bill has amount but expected is €0.00'
        }

        reconciliation.discrepancies.push({
          ...billInfo,
          issue
        })
      }

      // Check for missing attendance records
      if (!groupsChecked.has(child.group_id)) {
        groupsChecked.add(child.group_id)

        // Check if group has pricing
        const { data: priceData } = await supabaseAdmin
          .rpc('get_group_lunch_price', {
            p_group_id: child.group_id,
            p_date: startDate.toISOString().split('T')[0]
          })

        if (!priceData || priceData === 0) {
          const { data: groupData } = await supabaseAdmin
            .from('groups')
            .select('name')
            .eq('id', child.group_id)
            .single()

          if (!reconciliation.missingPricing.find(m => m.groupId === child.group_id)) {
            reconciliation.missingPricing.push({
              groupId: child.group_id,
              groupName: groupData?.name || child.group_id
            })
          }
        }
      }

      // Check for missing attendance (sample check - could be expanded)
      const { count: attendanceCount } = await supabaseAdmin
        .from('attendance')
        .select('id', { count: 'exact', head: true })
        .eq('child_id', child.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])

      // If no attendance records but bill has amount, flag it
      if ((!attendanceCount || attendanceCount === 0) && actualAmount > 0) {
        reconciliation.missingAttendance.push({
          childId: child.id,
          childName,
          date: startDate.toISOString().split('T')[0],
          issue: 'No attendance records found for billing period'
        })
      }
    }

    reconciliation.summary.difference = reconciliation.summary.actualTotal - reconciliation.summary.expectedTotal

    return {
      success: true,
      reconciliation
    }
  } catch (error: any) {
    console.error('Error generating reconciliation:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to generate reconciliation'
    })
  }
})
