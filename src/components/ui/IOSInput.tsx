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
    <div className={cn('w-full space-y-2', className)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-bold text-foreground/80 tracking-tight">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          className={cn(
            'w-full px-4 py-3 bg-background border-2 border-border rounded-2xl text-foreground placeholder:text-muted transition-all duration-300 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-red-500 focus:ring-red-500 focus:border-red-500'
          )}
          {...props}
        />
        {error && (
          <p className="mt-2 text-xs font-bold text-red-500 tracking-tight">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
