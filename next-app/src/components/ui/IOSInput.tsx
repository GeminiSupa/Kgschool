import React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface IOSInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function IOSInput({ label, error, className, id, ...props }: IOSInputProps) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-[14px] font-semibold text-[#1d1d1f] mb-2 tracking-[0.3px]">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          className={cn(
            'w-full px-4 py-3 bg-white/90 backdrop-blur-[10px] border border-black/10 rounded-[12px] text-[#1d1d1f] text-base transition-all duration-200 outline-none appearance-none placeholder:text-black/40',
            'focus:bg-white focus:border-[#667eea]/50 focus:shadow-[0_0_0_4px_rgba(102,126,234,0.2)] focus:scale-[1.01]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-[#ff3b30]/60 bg-[#ff3b30]/10',
            className
          )}
          {...props}
        />
        {error && (
          <div className="mt-[6px] text-[13px] text-[#ff3b30] font-medium">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
