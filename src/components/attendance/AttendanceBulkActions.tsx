'use client'

import React from 'react'
import { IOSButton } from '@/components/ui/IOSButton'

interface AttendanceBulkActionsProps {
  selectAll: boolean
  selectedCount: number
  onToggleSelectAll: () => void
  onMarkAllPresent: () => void
  onClearSelection: () => void
}

export const AttendanceBulkActions = ({
  selectAll,
  selectedCount,
  onToggleSelectAll,
  onMarkAllPresent,
  onClearSelection
}: AttendanceBulkActionsProps) => {
  return (
    <div className="bg-[#f2f2f7] border border-black/5 rounded-2xl p-4 mb-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={onToggleSelectAll}
                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-black/10 bg-white transition-all checked:bg-[#667eea] checked:border-[#667eea]"
              />
              <svg
                className="pointer-events-none absolute h-3.5 w-3.5 translate-x-[3px] text-white opacity-0 peer-checked:opacity-100"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:text-slate-50 transition-colors">Alle auswählen</span>
          </label>
          <span className="text-sm font-bold text-[#667eea] bg-[#667eea]/10 px-2 py-0.5 rounded-full">
            {selectedCount} ausgewählt
          </span>
        </div>
        <div className="flex gap-2">
          <IOSButton
            variant="primary"
            onClick={onMarkAllPresent}
            disabled={selectedCount === 0}
            className="px-4 py-1.5 text-xs font-bold"
          >
            Alle anwesend
          </IOSButton>
          <IOSButton
            variant="secondary"
            onClick={onClearSelection}
            disabled={selectedCount === 0}
            className="px-4 py-1.5 text-xs font-bold"
          >
            Auswahl aufheben
          </IOSButton>
        </div>
      </div>
    </div>
  )
}
