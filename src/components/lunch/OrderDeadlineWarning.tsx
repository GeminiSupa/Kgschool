'use client'

import React, { useState, useEffect, useMemo } from 'react'

interface OrderDeadlineWarningProps {
  orderDate: string
}

export const OrderDeadlineWarning = ({ orderDate }: OrderDeadlineWarningProps) => {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const deadline = useMemo(() => {
    const date = new Date(orderDate)
    date.setHours(8, 0, 0, 0)
    return date
  }, [orderDate])

  const isDeadlinePassed = currentTime >= deadline

  const timeRemaining = useMemo(() => {
    if (isDeadlinePassed) return null

    const diff = deadline.getTime() - currentTime.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) return `${hours}h ${minutes}m`
    if (minutes > 0) return `${minutes}m`
    return 'Weniger als eine Minute'
  }, [currentTime, deadline, isDeadlinePassed])

  return (
    <div
      className={`p-5 rounded-2xl border-2 transition-all duration-300 ${
        isDeadlinePassed
          ? 'bg-amber-50 border-amber-200'
          : 'bg-indigo-50 border-indigo-200'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="text-3xl">
          {isDeadlinePassed ? '⚠️' : '⏰'}
        </div>
        <div className="flex-1">
          <h4
            className={`text-sm font-black uppercase tracking-widest ${
              isDeadlinePassed ? 'text-amber-800' : 'text-indigo-800'
            }`}
          >
            {isDeadlinePassed ? 'Anmeldeschluss abgelaufen' : 'Bestellfrist'}
          </h4>
          <p
            className={`mt-1.5 text-sm font-medium leading-relaxed ${
              isDeadlinePassed ? 'text-amber-700' : 'text-indigo-700'
            }`}
          >
            {!isDeadlinePassed ? (
              <>Bestellungen können bis <strong>08:00 Uhr heute</strong> kostenlos storniert werden.</>
            ) : (
              <>Die Stornierungsfrist ist abgelaufen. Diese Bestellung wird in Rechnung gestellt.</>
            )}
          </p>
          {!isDeadlinePassed && timeRemaining && (
            <div className="mt-3 inline-flex items-center px-2.5 py-1 bg-indigo-100/50 rounded-lg text-xs font-bold text-indigo-700 border border-indigo-200/50">
              Verbleibende Zeit: {timeRemaining}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
