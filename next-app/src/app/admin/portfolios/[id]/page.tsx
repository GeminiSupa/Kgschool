'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.portfolios.id'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { usePortfoliosStore, type Portfolio } from '@/stores/portfolios'
import { useChildrenStore } from '@/stores/children'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'

export default function AdminPortfolioDetailsPage() {
  const { t } = useI18n()

  const router = useRouter()
  const params = useParams<{ id: string }>()
  const portfolioId = params?.id

  const portfoliosStore = usePortfoliosStore()
  const childrenStore = useChildrenStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)

  const children = childrenStore.children

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        setError('')

        await Promise.all([portfoliosStore.fetchPortfolios(), childrenStore.fetchChildren()])

        if (!portfolioId) {
          setError('Portfolio item not found.')
          setPortfolio(null)
          return
        }

        const found = portfoliosStore.portfolios.find((p) => p.id === portfolioId) || null
        if (!found) {
          setError('Portfolio item not found.')
          setPortfolio(null)
          return
        }

        setPortfolio(found)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load portfolio item')
      } finally {
        setLoading(false)
      }
    }

    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolioId])

  const getChildName = (childId: string) => {
    const c = children.find((ch) => ch.id === childId)
    return c ? `${c.first_name} ${c.last_name}` : childId
  }

  const formatDate = (date: string) => new Date(date).toLocaleDateString()

  return (
    <div>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push('/admin/portfolios')}
          className="text-gray-600 hover:text-gray-900 mb-4 inline-block"
        >
          ← Back to Portfolios
        </button>
        <Heading size="xl">{t(pT(ROUTE))}</Heading>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="mb-6">
          <ErrorAlert message={error} />
        </div>
      ) : !portfolio ? (
        <IOSCard className="p-8 text-center text-gray-500 max-w-3xl mx-auto">
          Portfolio item not found.
        </IOSCard>
      ) : (
        <IOSCard className="p-6 max-w-3xl mx-auto">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Title</h3>
              <p className="mt-1 text-lg text-gray-900">{portfolio.title}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Child</h3>
              <p className="mt-1 text-lg text-gray-900">{getChildName(portfolio.child_id)}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Type</h3>
              <p className="mt-1 text-lg text-gray-900">{portfolio.portfolio_type}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Date</h3>
              <p className="mt-1 text-lg text-gray-900">{formatDate(portfolio.date)}</p>
            </div>

            {portfolio.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1 text-gray-900">{portfolio.description}</p>
              </div>
            )}

            {portfolio.content && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Content</h3>
                <pre className="mt-1 text-gray-900 whitespace-pre-wrap font-sans text-sm">{portfolio.content}</pre>
              </div>
            )}

            {portfolio.attachments && portfolio.attachments.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Attachments</h3>
                <div className="grid grid-cols-3 gap-2">
                  {portfolio.attachments.map((attachment) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={attachment}
                      src={attachment}
                      alt="Portfolio attachment"
                      className="w-full h-32 object-cover rounded-md"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </IOSCard>
      )}
    </div>
  )
}

