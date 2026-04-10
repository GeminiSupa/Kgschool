import React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface IOSButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'small' | 'medium' | 'large'
}

export function IOSButton({
  variant = 'primary',
  size = 'medium',
  className,
  children,
  ...props
}: IOSButtonProps) {
  const variants = {
    primary:
      'bg-[color:var(--aura-primary)] text-white shadow-lg shadow-black/10 hover:brightness-110 active:brightness-95 focus-visible:ring-[color:var(--aura-primary)]',
    secondary:
      'bg-card border-2 border-border text-foreground hover:bg-slate-50 dark:bg-white/5 dark:hover:bg-white/10 focus:ring-[color:var(--aura-primary)] font-bold',
    ghost: 'bg-transparent text-muted hover:bg-slate-100 dark:hover:bg-white/5 hover:text-foreground',
    danger: 'bg-red-600 text-white shadow-lg shadow-black/10 hover:bg-red-500 focus-visible:ring-red-500',
  }
  /* Min heights meet ~44–48px touch targets (mobile-first) */
  const sizes = {
    small: 'min-h-11 px-4 py-2 text-xs',
    medium: 'min-h-11 px-6 py-2.5 text-sm',
    large: 'min-h-12 px-6 py-3.5 text-base',
  }

  return (
    <button
      {...props}
      className={cn(
        'box-border inline-flex max-w-full items-center justify-center gap-2 rounded-2xl font-bold whitespace-normal wrap-break-word text-center transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:focus-visible:ring-offset-background',
        variants[variant as keyof typeof variants] || variants.primary,
        sizes[size as keyof typeof sizes] || sizes.medium,
        className
      )}
    >
      {children}
    </button>
  )
}
