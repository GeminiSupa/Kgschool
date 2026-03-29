import { redirect } from 'next/navigation'

interface LegacyBillingDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ParentBillingLegacyDetailPage({ params }: LegacyBillingDetailPageProps) {
  const { id } = await params
  redirect(`/parent/fees?id=${encodeURIComponent(id)}`)
}

