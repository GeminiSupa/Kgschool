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
        'relative overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
        'rounded-4xl border border-border bg-card backdrop-blur-xl',
        elevated ? 'shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:-translate-y-0.5' : 'shadow-sm',
        className
      )}
    >
      <div className="absolute inset-0 bg-linear-to-b from-black/2 to-transparent pointer-events-none dark:from-white/4" />
      {children}
    </div>
  )
}
