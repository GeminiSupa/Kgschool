import { NextResponse } from 'next/server'
import { getAdminClient, requireTenantRole } from '@/utils/authz/tenantGuard'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const item_ids = body?.item_ids as string[] | undefined

    if (!item_ids || !Array.isArray(item_ids) || item_ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Missing required field: item_ids (array)' },
        { status: 400 },
      )
    }

    const { kitaId } = await requireTenantRole('admin')
    const supabaseAdmin = getAdminClient()

    const today = new Date().toISOString().split('T')[0]
    let processedCount = 0

    const { data: items, error: itemsError } = await supabaseAdmin
      .from('lunch_billing_items')
      .select(`
        *,
        monthly_billing!inner(id, child_id, refund_amount, children!inner(id, kita_id))
      `)
      .in('id', item_ids)
      .eq('is_refundable', true)
      .eq('refunded', false)
      .eq('monthly_billing.children.kita_id', kitaId)

    if (itemsError) throw itemsError

    const billingUpdates = new Map<string, number>()

    for (const item of items || []) {
      const { error: updateError } = await supabaseAdmin.from('lunch_billing_items').update({
        refunded: true,
        refund_date: today,
      }).eq('id', item.id)

      if (updateError) {
        console.error(`Error updating item ${item.id}:`, updateError)
        continue
      }

      processedCount++

      const billingId = item.monthly_billing.id
      const currentRefund = billingUpdates.get(billingId) || 0
      billingUpdates.set(billingId, currentRefund + item.meal_price)
    }

    for (const [billingId, refundAmount] of billingUpdates.entries()) {
      const { data: billing } = await supabaseAdmin
        .from('monthly_billing')
        .select('refund_amount')
        .eq('id', billingId)
        .single()

      const newRefundAmount = (billing?.refund_amount || 0) + refundAmount

      await supabaseAdmin
        .from('monthly_billing')
        .update({ refund_amount: newRefundAmount })
        .eq('id', billingId)
    }

    return NextResponse.json({ success: true, count: processedCount })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to process refunds'
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}

