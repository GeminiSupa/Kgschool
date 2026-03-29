import React from 'react'
import Link from 'next/link'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'

export default function KitchenMenusPage() {
  return (
    <div>
      <Link href="/admin/lunch/menus" className="inline-block text-blue-600 hover:text-blue-700 mb-4">
        ← Use Admin Menu Management
      </Link>

      <div className="flex justify-between items-center mb-6">
        <Heading size="xl">Lunch Menus</Heading>
        <Link
          href="/admin/lunch/menus/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          ➕ Add Menu
        </Link>
      </div>

      <IOSCard className="p-6">
        <p className="text-gray-600">
          Menu management is available through the Admin section.{' '}
          <Link href="/admin/lunch/menus" className="text-blue-600 hover:text-blue-700">
            Click here to manage menus
          </Link>
        </p>
      </IOSCard>
    </div>
  )
}

