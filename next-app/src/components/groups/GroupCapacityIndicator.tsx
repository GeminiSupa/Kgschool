import React from 'react'

interface GroupCapacityIndicatorProps {
  current: number
  max: number
}

export function GroupCapacityIndicator({ current, max }: GroupCapacityIndicatorProps) {
  const utilizationPercent = max === 0 ? 0 : Math.min(100, (current / max) * 100)

  let capacityClass = 'text-green-600'
  let progressBarClass = 'bg-green-600'
  let warningClass = ''
  let warningText: string | null = null

  if (utilizationPercent >= 100) {
    capacityClass = 'text-red-600'
    progressBarClass = 'bg-red-600'
    warningText = 'Full'
    warningClass = 'bg-red-100 text-red-800'
  } else if (utilizationPercent >= 90) {
    capacityClass = 'text-orange-600'
    progressBarClass = 'bg-orange-600'
    warningText = 'Nearly Full'
    warningClass = 'bg-orange-100 text-orange-800'
  } else if (utilizationPercent >= 80) {
    capacityClass = 'text-yellow-600'
    progressBarClass = 'bg-yellow-600'
    warningText = 'Getting Full'
    warningClass = 'bg-yellow-100 text-yellow-800'
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">Capacity</span>
          <span className={`text-sm font-medium ${capacityClass}`}>
            {current} / {max}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${progressBarClass}`}
            style={{ width: `${utilizationPercent}%` }}
          />
        </div>
      </div>
      {warningText && (
        <span className={`text-xs px-2 py-1 rounded-full ${warningClass}`}>
          {warningText}
        </span>
      )}
    </div>
  )
}
