import React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface HeadingProps {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  children: React.ReactNode
  className?: string
}

export function Heading({ as: Component = 'h2', size = 'md', children, className }: HeadingProps) {
  const sizes = {
    xs: 'text-sm font-semibold',
    sm: 'text-base font-semibold',
    md: 'text-lg font-semibold',
    lg: 'text-xl font-semibold',
    xl: 'text-2xl font-bold',
    '2xl': 'text-3xl font-bold'
  }

  return (
    <Component
      className={cn(
        'font-display font-bold tracking-tight text-foreground',
        sizes[size],
        className
      )}
    >
      {children}
    </Component>
  )
}
