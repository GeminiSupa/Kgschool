'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'parent.learning-themes'

import React, { useEffect, useState } from 'react'
import { useLearningThemesStore, LearningTheme } from '@/stores/learningThemes'
import { useChildrenStore } from '@/stores/children'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export default function ParentLearningThemesPage() {
  const { t } = useI18n()

  const { learningThemes, loading, fetchLearningThemes } = useLearningThemesStore()
  const { children, fetchChildren } = useChildrenStore()
  
  useEffect(() => {
    fetchChildren()
    fetchLearningThemes()
  }, [fetchChildren, fetchLearningThemes])

  if (loading && learningThemes.length === 0) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-10 text-center">
        <Heading size="xl" className="text-gray-900 tracking-tight">{t(pT(ROUTE))}</Heading>
        <p className="text-sm text-gray-500 mt-1">Aktuelle Lernthemen und pädagogische Projekte in der Kita.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {learningThemes.map(theme => (
                <IOSCard key={theme.id} className="p-0 overflow-hidden border-black/5 group hover:shadow-2xl transition-all duration-500">
                    <div className="h-40 bg-gray-100 overflow-hidden relative">
                        {theme.photos?.[0] ? (
                             <img src={theme.photos[0]} alt={theme.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                             <div className="w-full h-full flex items-center justify-center text-4xl opacity-20 bg-gradient-to-br from-gray-50 to-gray-200">📚</div>
                        )}
                        <span className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur text-[9px] font-black uppercase tracking-widest rounded-full border border-black/5 text-indigo-600">
                             {theme.status}
                        </span>
                    </div>
                    <div className="p-8">
                        <h3 className="text-xl font-black text-gray-900 mb-3">{theme.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-6 font-medium leading-relaxed">{theme.description}</p>
                        
                        {theme.learning_areas && theme.learning_areas.length > 0 && (
                             <div className="flex flex-wrap gap-2">
                                 {theme.learning_areas.map(area => (
                                     <span key={area} className="px-2 py-0.5 bg-gray-50 text-gray-400 text-[9px] font-black uppercase tracking-widest rounded-md border border-black/5">{area}</span>
                                 ))}
                             </div>
                        )}
                    </div>
                </IOSCard>
            ))}
      </div>
    </div>
  )
}
