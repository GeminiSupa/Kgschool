import { NextResponse } from 'next/server'
import { getAdminClient, requireTenantRole } from '@/utils/authz/tenantGuard'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const start_month = Number(url.searchParams.get('start_month'))
    const start_year = Number(url.searchParams.get('start_year'))
    const end_month = Number(url.searchParams.get('end_month'))
    const end_year = Number(url.searchParams.get('end_year'))

    if (!start_month || !start_year || !end_month || !end_year) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters: start_month, start_year, end_month, end_year' },
        { status: 400 },
      )
    }

    const { kitaId } = await requireTenantRole('admin')
    const supabaseAdmin = getAdminClient()

    const startDate = new Date(start_year, start_month - 1, 1)
    const endDate = new Date(end_year, end_month, 0)

    const { data: bills, error: billsError } = await supabaseAdmin
      .from('monthly_billing')
      .select('*, children!inner(id, kita_id)')
      .gte('billing_date', startDate.toISOString().split('T')[0])
      .lte('billing_date', endDate.toISOString().split('T')[0])
      .eq('children.kita_id', kitaId)
      .order('year', { ascending: true })
      .order('month', { ascending: true })

    if (billsError) throw billsError

    const totalRevenue = bills?.reduce((sum: number, bill: any) => sum + parseFloat(bill.total_amount.toString()), 0) || 0
    const totalPaid = bills?.reduce((sum: number, bill: any) => sum + parseFloat(bill.paid_amount.toString()), 0) || 0
    const totalRefunds = bills?.reduce((sum: number, bill: any) => sum + parseFloat(bill.refund_amount.toString()), 0) || 0
    const pendingAmount = totalRevenue - totalPaid

    const monthlyMap = new Map<string, any>()

    bills?.forEach((bill: any) => {
      const key = `${bill.year}-${bill.month}`
      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, {
          month: bill.month,
          year: bill.year,
          totalRevenue: 0,
          totalPaid: 0,
          totalRefunds: 0,
          billsCount: 0,
        })
      }

      const monthData = monthlyMap.get(key)!
      monthData.totalRevenue += parseFloat(bill.total_amount.toString())
      monthData.totalPaid += parseFloat(bill.paid_amount.toString())
      monthData.totalRefunds += parseFloat(bill.refund_amount.toString())
      monthData.billsCount += 1
    })

    const monthlyBreakdown = Array.from(monthlyMap.values()).sort((a: any, b: any) => {
      if (a.year !== b.year) return a.year - b.year
      return a.month - b.month
    })

    monthlyBreakdown.forEach((month: any) => {
      month.pendingAmount = month.totalRevenue - month.totalPaid
    })

    return NextResponse.json({
      totalRevenue,
      totalPaid,
      totalRefunds,
      pendingAmount,
      monthlyBreakdown,
      billsCount: bills?.length || 0,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate report'
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}

