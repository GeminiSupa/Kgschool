'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'parent.absences'

import Link from 'next/link'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'

export default function ParentAbsencesPage() {
  const { t } = useI18n()

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Heading size="xl" className="text-gray-900">{t(pT(ROUTE))}</Heading>
          <p className="text-sm text-gray-500 mt-1">
            Melden Sie neue Abwesenheiten und behalten Sie den Überblick.
          </p>
        </div>
        <Link href="/parent/absences/new">
          <IOSButton type="button" variant="primary">
            + Neue Abwesenheit
          </IOSButton>
        </Link>
      </div>

      <IOSCard className="p-6">
        <p className="text-sm text-gray-600">
          Ihre Abwesenheitsmeldungen werden im Bereich <strong>Anwesenheit</strong> und in den Tagesdaten automatisch
          berücksichtigt. Nutzen Sie den Button oben, um direkt eine neue Meldung einzureichen.
        </p>
      </IOSCard>
    </div>
  )
}

