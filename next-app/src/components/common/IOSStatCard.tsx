import React from 'react'
import Link from 'next/link'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface Trend {
  type: 'up' | 'down'
  value: string
}

interface IOSStatCardProps {
  title: string
  value: number | string
  icon?: string
  subtitle?: string
  trend?: Trend
  className?: string
  to?: string
  color?: string
}

export function IOSStatCard({
  title,
  value,
  icon,
  subtitle,
  trend,
  className,
  to,
  color
}: IOSStatCardProps) {
  const formatValue = typeof value === 'number' ? value.toLocaleString() : value

  const Content = (
    <>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[12px] font-bold text-slate-400 mb-2 tracking-wider uppercase">
            {title}
          </p>
          <p className="text-[32px] md:text-[28px] font-black leading-tight text-slate-900 tracking-tight">
            {formatValue}
          </p>
          {subtitle && (
            <p className="text-[12px] text-slate-400 mt-1 font-medium">
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-[24px] text-indigo-600">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-4 pt-4 border-t border-slate-50">
          <div className={cn("flex items-center text-xs font-bold", trend.type === 'up' ? 'text-emerald-500' : 'text-rose-500')}>
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-current bg-opacity-10">
              <span>{trend.type === 'up' ? '↑' : '↓'}</span>
              <span>{trend.value}</span>
            </span>
            <span className="ml-2 text-slate-400 font-medium whitespace-nowrap">vs last month</span>
          </div>
        </div>
      )}
    </>
  )

  const cardClasses = cn(
    'block bg-white border border-slate-100 rounded-3xl p-6 shadow-xl shadow-slate-200/40 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] text-inherit no-underline group h-full',
    to && 'cursor-pointer hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-200/30 hover:border-indigo-100 active:scale-[0.98]',
    color,
    className
  )

  if (to) {
    return (
      <Link href={to} className={cardClasses}>
        {Content}
      </Link>
    )
  }

  return (
    <div className={cardClasses}>
      {Content}
    </div>
  )
}
