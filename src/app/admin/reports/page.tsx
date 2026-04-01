'use client'

import React from 'react'
import Link from 'next/link'
import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'
import { sT } from '@/i18n/sT'
import { IOSCard } from '@/components/ui/IOSCard'

const ROUTE = 'admin.reports'

export default function ReportsIndexPage() {
  const { t } = useI18n()

  const reportCategories = [
    {
      title: 'Pedagogical Analytics',
      description: 'Student progress, observations, and learning theme effectiveness.',
      icon: '🎨',
      links: [
        { href: '/admin/observations', label: 'Student Observations' },
        { href: '/admin/portfolios', label: 'Development Portfolios' },
        { href: '/admin/learning-themes', label: 'Learning Themes Analysis' }
      ],
      color: 'bg-indigo-50 text-indigo-600'
    },
    {
      title: 'Operational Performance',
      description: 'Staff attendance, daily report consistency, and group metrics.',
      icon: '📊',
      links: [
        { href: '/admin/attendance', label: 'Attendance Reports' },
        { href: '/admin/daily-reports', label: 'Daily Activity Logs' },
        { href: '/admin/staff', label: 'Staff Performance' }
      ],
      color: 'bg-emerald-50 text-emerald-600'
    },
    {
      title: 'Financial & Compliance',
      description: 'Fee collection, billing audit logs, and contract status.',
      icon: '💰',
      links: [
        { href: '/admin/fees', label: 'Revenue Overview' },
        { href: '/admin/contracts', label: 'Contract Compliance' },
        { href: '/admin/parent-work', label: 'Parent Hours Tracking' }
      ],
      color: 'bg-amber-50 text-amber-600'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <div className="mb-16">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4 font-display">{t(sT('reportsHubTitle'))}</h1>
        <p className="text-lg text-slate-500 font-medium max-w-2xl">{t(sT('reportsHubSubtitle'))}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {reportCategories.map((category) => (
          <IOSCard key={category.title} className="p-10 flex flex-col h-full border-slate-50 shadow-xl shadow-slate-200/40 group hover:border-indigo-100 transition-all duration-500">
            <div className={`w-16 h-16 ${category.color} rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 group-hover:-translate-y-1 transition-all shadow-sm`}>
              {category.icon}
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{category.title}</h3>
            <p className="text-slate-500 font-medium mb-10 flex-1">{category.description}</p>
            
            <div className="space-y-3 pt-8 border-t border-slate-50">
              {category.links.map((link) => (
                <Link key={link.href} href={link.href} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-transparent hover:border-indigo-100 hover:bg-white transition-all group/link">
                  <span className="text-sm font-bold text-slate-700 group-hover/link:text-indigo-600">{link.label}</span>
                  <span className="text-slate-300 group-hover/link:translate-x-1 group-hover/link:text-indigo-400 transition-all">→</span>
                </Link>
              ))}
            </div>
          </IOSCard>
        ))}
      </div>

      {/* Placeholder for future specialized charts */}
      <div className="mt-20">
        <IOSCard className="p-12 text-center bg-slate-900 text-white border-0 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-10 left-10 w-40 h-40 bg-indigo-500 rounded-full blur-[100px]" />
            <div className="absolute bottom-10 right-10 w-60 h-60 bg-purple-500 rounded-full blur-[100px]" />
          </div>
          <div className="relative z-10 max-w-xl mx-auto">
            <h4 className="text-2xl font-black mb-4 font-display">{t(sT('reportsAdvancedTitle'))}</h4>
            <p className="text-slate-400 font-medium mb-8 italic">{t(sT('reportsBuilding'))}</p>
            <div className="inline-flex items-center gap-2 px-6 py-2 bg-white/10 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              {t(sT('reportsInDevelopment'))}
            </div>
          </div>
        </IOSCard>
      </div>
    </div>
  )
}
