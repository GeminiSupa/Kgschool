'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'teacher.attendance.scan'

import React, { useState } from 'react'
import Link from 'next/link'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { sT } from '@/i18n/sT'

export default function TeacherAttendanceScanPage() {
  const { t } = useI18n()

  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')

  const startScanning = () => {
    setError('')
    setScanning(true)
    // QR code scanning is currently disabled in this port.
    alert(t(sT('errQrNotImplemented')))
    setScanning(false)
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/teacher/attendance" className="text-ui-muted hover:text-slate-900 dark:text-slate-50 mb-4 inline-block">
          ← Back to Attendance
        </Link>
        <Heading size="xl">{t(pT(ROUTE))}</Heading>
        <p className="text-ui-muted mt-2">QR code scanning has been disabled. Please use the manual attendance system.</p>
      </div>

      <IOSCard className="p-6 max-w-md mx-auto">
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}

        <div className="text-center p-8">
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              QR code scanning is no longer available. Please use the enhanced attendance system with manual
              check-in/check-out or bulk actions.
            </p>
          </div>

          <div className="space-y-3">
            <IOSButton
              variant="primary"
              className="w-full"
              disabled={scanning}
              onClick={startScanning}
            >
              {scanning ? 'Scanning...' : 'Try QR Scan (Disabled)'}
            </IOSButton>

            <Link
              href="/teacher/attendance"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Attendance Page
            </Link>
          </div>
        </div>
      </IOSCard>
    </div>
  )
}

