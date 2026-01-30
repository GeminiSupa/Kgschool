import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const { start_month, start_year, end_month, end_year } = query

    if (!start_month || !start_year || !end_month || !end_year) {
      throw createError({
        statusCode: 400,
        message: 'Missing required parameters: start_month, start_year, end_month, end_year'
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

    // Build date range query
    const startDate = new Date(parseInt(start_year as string), parseInt(start_month as string) - 1, 1)
    const endDate = new Date(parseInt(end_year as string), parseInt(end_month as string), 0)

    // Get all bills in date range
    const { data: bills, error: billsError } = await supabaseAdmin
      .from('monthly_billing')
      .select('*')
      .gte('billing_date', startDate.toISOString().split('T')[0])
      .lte('billing_date', endDate.toISOString().split('T')[0])
      .order('year', { ascending: true })
      .order('month', { ascending: true })

    if (billsError) throw billsError

    // Calculate totals
    const totalRevenue = bills?.reduce((sum, bill) => sum + parseFloat(bill.total_amount.toString()), 0) || 0
    const totalPaid = bills?.reduce((sum, bill) => sum + parseFloat(bill.paid_amount.toString()), 0) || 0
    const totalRefunds = bills?.reduce((sum, bill) => sum + parseFloat(bill.refund_amount.toString()), 0) || 0
    const pendingAmount = totalRevenue - totalPaid

    // Monthly breakdown
    const monthlyMap = new Map<string, any>()

    bills?.forEach(bill => {
      const key = `${bill.year}-${bill.month}`
      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, {
          month: bill.month,
          year: bill.year,
          totalRevenue: 0,
          totalPaid: 0,
          totalRefunds: 0,
          billsCount: 0
        })
      }

      const monthData = monthlyMap.get(key)!
      monthData.totalRevenue += parseFloat(bill.total_amount.toString())
      monthData.totalPaid += parseFloat(bill.paid_amount.toString())
      monthData.totalRefunds += parseFloat(bill.refund_amount.toString())
      monthData.billsCount += 1
    })

    const monthlyBreakdown = Array.from(monthlyMap.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return a.month - b.month
    })

    // Calculate pending for each month
    monthlyBreakdown.forEach(month => {
      month.pendingAmount = month.totalRevenue - month.totalPaid
    })

    return {
      totalRevenue,
      totalPaid,
      totalRefunds,
      pendingAmount,
      monthlyBreakdown,
      billsCount: bills?.length || 0
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to generate report'
    })
  }
})
