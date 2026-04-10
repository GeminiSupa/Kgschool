'use client'

import React from 'react'
import { IOSButton } from '@/components/ui/IOSButton'

interface CheckInOutButtonProps {
  childId: string
  date: string
  checkInTime?: string
  checkOutTime?: string
  loading?: boolean
  onCheckIn: (childId: string, date: string) => void
  onCheckOut: (childId: string, date: string) => void
}

export const CheckInOutButton = ({
  childId,
  date,
  checkInTime,
  checkOutTime,
  loading,
  onCheckIn,
  onCheckOut
}: CheckInOutButtonProps) => {
  const formatTime = (time: string) => {
    return new Date(time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex gap-2">
      {!checkInTime ? (
        <IOSButton
          variant="primary"
          onClick={() => onCheckIn(childId, date)}
          disabled={loading}
          className="text-xs px-3 py-1.5 font-bold"
        >
          Check-In
        </IOSButton>
      ) : (
        <div className="px-3 py-1.5 text-xs font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200 rounded-lg border border-emerald-200 dark:border-emerald-400/20 flex items-center">
          ⬇️ {formatTime(checkInTime)}
        </div>
      )}

      {checkInTime && !checkOutTime && (
        <IOSButton
          variant="secondary"
          onClick={() => onCheckOut(childId, date)}
          disabled={loading}
          className="text-xs px-3 py-1.5 font-bold bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100 dark:bg-orange-400/10 dark:text-orange-200 dark:border-orange-400/20 dark:hover:bg-orange-400/15"
        >
          Check-Out
        </IOSButton>
      ) || checkOutTime && (
        <div className="px-3 py-1.5 text-xs font-bold bg-slate-50 text-slate-800 dark:bg-white/5 dark:text-slate-200 rounded-lg border border-border flex items-center">
          ⬆️ {formatTime(checkOutTime)}
        </div>
      )}
    </div>
  )
}
