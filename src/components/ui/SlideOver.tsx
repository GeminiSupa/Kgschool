'use client'

import React, { useEffect, useState } from 'react'

interface SlideOverProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export const SlideOver: React.FC<SlideOverProps> = ({ isOpen, onClose, title, children }) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      document.body.style.overflow = 'hidden'
    } else {
      setTimeout(() => setMounted(false), 300)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!mounted && !isOpen) return null

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={onClose} />
      
      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className={`w-screen max-w-md transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="h-full flex flex-col bg-background text-foreground shadow-2xl">
            <div className="px-6 py-8 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-black tracking-tight">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-xl text-ui-soft transition-colors hover:bg-slate-50 dark:hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--aura-primary)/25"
              >
                <span aria-hidden>✕</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
