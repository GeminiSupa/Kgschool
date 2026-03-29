import React from 'react'

export function LoadingSpinner({ 
  size = 'md',
  color = 'border-blue-600'
}: { 
  size?: 'sm' | 'md',
  color?: string 
}) {
  const isSm = size === 'sm'
  return (
    <div className="flex items-center justify-center">
      <div
        className={`animate-spin rounded-full border-b-2 ${color}`}
        style={{
          height: isSm ? 20 : 32,
          width: isSm ? 20 : 32,
        }}
      />
    </div>
  )
}
