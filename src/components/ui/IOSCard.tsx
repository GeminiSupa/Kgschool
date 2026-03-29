import React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface IOSCardProps {
  elevated?: boolean
  blur?: boolean
  className?: string
  children: React.ReactNode
  onClick?: React.MouseEventHandler<HTMLDivElement>
}

export function IOSCard({ elevated = true, blur = false, className, children, onClick }: IOSCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-3xl border border-slate-100 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
        elevated ? 'shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-200/50' : 'shadow-sm',
        className
      )}
    >
      {children}
    </div>
  )
}
