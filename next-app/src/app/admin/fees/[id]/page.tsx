'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.fees.id'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useMonthlyFeesStore, MonthlyFee, FeePayment } from '@/stores/monthlyFees'
import { useChildrenStore } from '@/stores/children'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { useToastStore } from '@/stores/toast'

export default function FeeDetailPage() {
  const { t } = useI18n()

  const router = useRouter()
  const { id } = useParams()
  const { fees, fetchFees, updateFee, recordPayment, fetchPayments } = useMonthlyFeesStore()
  const { children, fetchChildren } = useChildrenStore()
  const toast = useToastStore()
  
  const [fee, setFee] = useState<MonthlyFee | null>(null)
  const [payments, setPayments] = useState<FeePayment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchFees(),
        fetchChildren(),
        fetchPayments(id as string).then(setPayments)
      ])
    } catch (e) {
      console.error('Error loading fee details:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (fees.length > 0 && id) {
      const found = fees.find(f => f.id === id)
      if (found) {
        setFee(found)
        setPaymentAmount(found.amount - payments.reduce((sum, p) => sum + p.amount, 0))
      }
    }
  }, [fees, id, payments])

  const getChildName = (childId: string) => {
    const child = children.find(c => c.id === childId)
    return child ? `${child.first_name} ${child.last_name}` : childId
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (paymentAmount <= 0) return
    setSubmitting(true)
    try {
      await recordPayment({
        fee_id: id as string,
        amount: paymentAmount,
        payment_date: new Date().toISOString()
      })
      toast.push({ type: 'success', title: 'Gebühren', message: 'Zahlung erfasst.' })
      loadData()
    } catch (e: any) {
      toast.push({ type: 'error', title: 'Gebühren', message: e?.message || 'Fehler beim Erfassen der Zahlung.' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusUpdate = async (status: MonthlyFee['status']) => {
    if (!fee) return
    try {
      await updateFee(fee.id, { status })
      toast.push({ type: 'success', title: 'Gebühren', message: 'Status aktualisiert.' })
      loadData()
    } catch (e: any) {
      toast.push({ type: 'error', title: 'Gebühren', message: e?.message || 'Fehler beim Aktualisieren des Status.' })
    }
  }

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner /></div>
  if (!fee) return <div className="max-w-4xl mx-auto py-12 text-center text-gray-500">Gebühr nicht gefunden.</div>

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const remaining = Math.max(0, fee.amount - totalPaid)

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <Link href="/admin/fees" className="text-sm font-semibold text-[#667eea] mb-2 inline-flex items-center gap-1 hover:translate-x-[-4px] transition-transform">
          ← Zurück zu Gebühren
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
            <div>
                <Heading size="xl" className="text-gray-900 tracking-tight">{t(pT(ROUTE))}</Heading>
                <p className="text-sm font-bold text-gray-500 mt-1">{getChildName(fee.child_id)} • {new Date(2000, fee.month - 1).toLocaleString('de-DE', { month: 'long' })} {fee.year}</p>
            </div>
            <div className={`px-4 py-2 rounded-2xl border font-black text-xs uppercase tracking-widest ${
                fee.status === 'paid' ? 'bg-green-50 text-green-700 border-green-100' :
                fee.status === 'overdue' ? 'bg-red-50 text-red-700 border-red-100' :
                'bg-amber-50 text-amber-700 border-amber-100'
            }`}>
                {fee.status === 'paid' ? 'Vollständig Bezahlt' : fee.status === 'overdue' ? 'Überfällig' : 'Zahlung Ausstehend'}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            <IOSCard className="p-8 border-black/5 shadow-indigo-900/5">
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-1.5">Gebührenart</p>
                        <p className="text-lg font-black text-gray-900 capitalize">{fee.fee_type}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-1.5">Fälligkeitsdatum</p>
                        <p className="text-lg font-black text-gray-900">{new Date(fee.due_date).toLocaleDateString('de-DE')}</p>
                    </div>
                </div>
                <div className="flex items-end justify-between p-6 bg-[#f2f2f7] rounded-3xl border border-black/5">
                    <div>
                        <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-1">Gesamtbetrag</p>
                        <p className="text-4xl font-black text-[#667eea]">€{fee.amount.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-1">Bereits bezahlt</p>
                        <p className="text-xl font-bold text-gray-900">€{totalPaid.toFixed(2)}</p>
                    </div>
                </div>
            </IOSCard>

            <IOSCard className="p-8 border-black/5 shadow-indigo-900/5">
                <h3 className="text-xs font-black text-black/30 uppercase tracking-widest mb-6 border-b border-black/5 pb-4">Zahlungshistorie</h3>
                {payments.length === 0 ? (
                    <p className="text-center py-8 text-gray-400 font-medium">Noch keine Zahlungen erfasst.</p>
                ) : (
                    <div className="space-y-4">
                        {payments.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-black/5">
                                <div>
                                    <p className="text-sm font-black text-gray-800">€{p.amount.toFixed(2)}</p>
                                    <p className="text-[10px] text-gray-400 font-bold">{new Date(p.payment_date).toLocaleDateString('de-DE')} • {p.payment_method || 'Zahlung'}</p>
                                </div>
                                <span className="text-[10px] font-black text-[#667eea] uppercase">Erfolgreich</span>
                            </div>
                        ))}
                    </div>
                )}
            </IOSCard>
         </div>

         <div className="space-y-8">
            {remaining > 0 && (
                <IOSCard className="p-6 border-black/5 shadow-xl shadow-blue-500/5 bg-white">
                    <h3 className="text-xs font-black text-black/30 uppercase tracking-widest mb-6">Zahlung Erfassen</h3>
                    <form onSubmit={handlePayment} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-black/30 uppercase tracking-widest mb-1.5 ml-1">Betrag (€)</label>
                            <input
                                type="number"
                                step="0.01"
                                max={remaining}
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-3 bg-gray-50 border border-black/5 rounded-2xl text-lg font-black text-gray-900 outline-none focus:ring-2 focus:ring-[#667eea] transition-all"
                            />
                        </div>
                        <IOSButton type="submit" disabled={submitting || paymentAmount <= 0} className="w-full py-3 font-black text-xs uppercase tracking-widest">
                            Zahlung buchen
                        </IOSButton>
                    </form>
                </IOSCard>
            )}

            <IOSCard className="p-6 border-black/5 shadow-sm">
                <h3 className="text-xs font-black text-black/30 uppercase tracking-widest mb-6">Aktionen</h3>
                <div className="space-y-2">
                    {fee.status !== 'paid' && (
                        <IOSButton variant="secondary" onClick={() => handleStatusUpdate('paid')} className="w-full py-2.5 text-[10px] font-black uppercase tracking-widest text-green-600 border-green-50 hover:bg-green-50">
                            Als bezahlt markieren
                        </IOSButton>
                    )}
                    {fee.status !== 'waived' && (
                        <IOSButton variant="secondary" onClick={() => handleStatusUpdate('waived')} className="w-full py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-500 border-gray-100">
                            Gebühr erlassen
                        </IOSButton>
                    )}
                     <IOSButton variant="secondary" onClick={() => handleStatusUpdate('overdue')} className="w-full py-2.5 text-[10px] font-black uppercase tracking-widest text-red-600 border-red-50 hover:bg-red-50">
                            Als überfällig markieren
                    </IOSButton>
                </div>
            </IOSCard>
         </div>
      </div>
    </div>
  )
}
