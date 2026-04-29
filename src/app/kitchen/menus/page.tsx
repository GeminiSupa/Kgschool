import React from 'react'
import Link from 'next/link'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'

export default function KitchenMenusPage() {
  return (
    <div>
      <Link
        href="/admin/lunch/menus"
        className="ui-inline-link mb-4"
      >
        ← Use Admin Menu Management
      </Link>

      <div className="flex justify-between items-center mb-6">
        <Heading size="xl">Lunch Menus</Heading>
        <Link
          href="/admin/lunch/menus/new"
          className="ui-cta-primary-link rounded-xl px-4 py-2.5"
        >
          ➕ Add Menu
        </Link>
      </div>

      <IOSCard className="p-6">
        <p className="text-ui-muted">
          Menu management is available through the Admin section.{' '}
          <Link href="/admin/lunch/menus" className="font-semibold text-aura-primary hover:brightness-110">
            Click here to manage menus
          </Link>
        </p>
      </IOSCard>
    </div>
  )
}

