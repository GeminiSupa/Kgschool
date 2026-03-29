import { NextResponse } from 'next/server'
import { getAdminClient, requireTenantRole } from '@/utils/authz/tenantGuard'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const month = Number(body?.month)
    const year = Number(body?.year)

    if (!month || !year) {
      return NextResponse.json(
        { success: false, message: 'Month and year are required' },
        { status: 400 }
      )
    }

    const { kitaId: userKitaId } = await requireTenantRole('admin')
    const supabaseAdmin = getAdminClient()

    // Get all staff (teachers, support, kitchen) - filter by kita_id if available.
    let staffQuery = supabaseAdmin
      .from('profiles')
      .select('id')
      .in('role', ['teacher', 'support', 'kitchen'])

    if (userKitaId) {
      const { data: memberIds } = await supabaseAdmin
        .from('organization_members')
        .select('profile_id')
        .eq('kita_id', userKitaId)

      const staffIds = memberIds?.map((m) => m.profile_id) || []
      if (staffIds.length > 0) {
        staffQuery = staffQuery.in('id', staffIds)
      } else {
        return NextResponse.json({
          success: true,
          count: 0,
          message: 'No staff members found in your Kita',
        })
      }
    }

    const { data: staff, error: staffError } = await staffQuery
    if (staffError) {
      return NextResponse.json(
        { success: false, message: staffError.message || 'Failed to load staff' },
        { status: 500 }
      )
    }

    if (!staff || staff.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: 'No staff members found' })
    }

    let generatedCount = 0

    for (const s of staff) {
      // Get current salary config.
      const { data: configData } = await supabaseAdmin.rpc('get_current_salary_config', {
        p_staff_id: s.id,
      })

      const config = configData && configData.length > 0 ? configData[0] : null
      if (!config) continue

      // Check if payroll already exists.
      const { data: existing } = await supabaseAdmin
        .from('staff_payroll')
        .select('id')
        .eq('staff_id', s.id)
        .eq('month', month)
        .eq('year', year)
        .maybeSingle()

      if (existing) continue

      // Calculate overtime rate/amount (currently overtime amount is placeholder: 0).
      let overtimeAmount = 0
      let overtimeRate = 0
      if (config.hourly_rate) {
        overtimeRate = config.hourly_rate * (config.overtime_multiplier || 1.5)
      }

      const netSalary = (config.base_salary || 0) + overtimeAmount

      const { error: insertError } = await supabaseAdmin.from('staff_payroll').insert({
        staff_id: s.id,
        month,
        year,
        base_salary: config.base_salary || 0,
        overtime_hours: 0, // Placeholder until work logs exist.
        overtime_rate: overtimeRate,
        overtime_amount: overtimeAmount,
        bonuses: 0,
        deductions: 0,
        tax_amount: 0,
        net_salary: netSalary,
        status: 'draft',
      })

      if (insertError) {
        console.error(`Error creating payroll for staff ${s.id}:`, insertError)
        continue
      }

      generatedCount++
    }

    return NextResponse.json({
      success: true,
      count: generatedCount,
      message: `Generated payroll for ${generatedCount} staff members`,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate payroll'
    console.error('Error in payroll generate endpoint:', err)
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}

