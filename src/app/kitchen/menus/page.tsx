import React from 'react'
import Link from 'next/link'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'

export default function KitchenMenusPage() {
  return (
    <div>
      <Link
        href="/admin/lunch/menus"
        className="mb-4 inline-flex min-h-11 items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 dark:text-indigo-400 dark:hover:text-indigo-300 dark:focus-visible:ring-indigo-500/40"
      >
        ← Use Admin Menu Management
      </Link>

      <div className="flex justify-between items-center mb-6">
        <Heading size="xl">Lunch Menus</Heading>
        <Link
          href="/admin/lunch/menus/new"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 dark:focus-visible:ring-indigo-500/50"
        >
          ➕ Add Menu
        </Link>
      </div>

      <IOSCard className="p-6">
        <p className="text-ui-muted">
          Menu management is available through the Admin section.{' '}
          <Link href="/admin/lunch/menus" className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
            Click here to manage menus
          </Link>
        </p>
      </IOSCard>
    </div>
  )
}

