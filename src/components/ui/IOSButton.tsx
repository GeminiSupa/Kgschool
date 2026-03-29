import React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface IOSButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'small' | 'medium' | 'large'
}

export function IOSButton({
  variant = 'primary',
  size = 'medium',
  className,
  children,
  ...props
}: IOSButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        'relative border-none font-semibold cursor-pointer transition-all duration-200 overflow-hidden select-none active:scale-[0.98]',
        // Variants
        variant === 'primary' && 'bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white shadow-[0_4px_14px_0_rgba(102,126,234,0.39)] hover:translate-y-[-2px] hover:shadow-[0_6px_20px_0_rgba(102,126,234,0.5)] active:translate-y-0 active:shadow-[0_2px_10px_0_rgba(102,126,234,0.3)] disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'secondary' && 'bg-white/20 backdrop-blur-[10px] text-[#667eea] border border-[#667eea]/30',
        variant === 'ghost' && 'bg-transparent text-white/90',
        // Sizes
        size === 'large' && 'px-8 py-4 text-lg rounded-[16px]',
        size === 'medium' && 'px-6 py-3 text-base rounded-[12px]',
        size === 'small' && 'px-4 py-2 text-sm rounded-[10px]',
        className
      )}
    >
      {children}
    </button>
  )
}
