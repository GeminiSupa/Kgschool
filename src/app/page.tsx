'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useI18n } from '@/i18n/I18nProvider'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import {
  ArrowRight,
  Users,
  Calendar,
  MessageSquare,
  BookOpen,
  CreditCard,
  LayoutDashboard,
  Heart,
} from 'lucide-react'
import { IOSButton } from '@/components/ui/IOSButton'

export default function Home() {
  const { t } = useI18n()

  const features = useMemo(
    () => [
      {
        icon: <LayoutDashboard className="w-8 h-8 text-indigo-500" />,
        titleKey: 'home.marketingFeature1Title',
        descKey: 'home.marketingFeature1Desc',
        image:
          'https://www.kinderpedia.co/media/yootheme/cache/29/student_information_system_1280px-290d7e79.webp',
      },
      {
        icon: <Users className="w-8 h-8 text-blue-500" />,
        titleKey: 'home.marketingFeature2Title',
        descKey: 'home.marketingFeature2Desc',
        image:
          'https://www.kinderpedia.co/media/yootheme/cache/66/parent_teacher_communication_app_1280-66b0e1d7.webp',
      },
      {
        icon: <BookOpen className="w-8 h-8 text-fuchsia-500" />,
        titleKey: 'home.marketingFeature3Title',
        descKey: 'home.marketingFeature3Desc',
        image:
          'https://www.kinderpedia.co/media/yootheme/cache/4a/classroom_management_software_1280px-4ab4ef11.webp',
      },
      {
        icon: <CreditCard className="w-8 h-8 text-violet-500" />,
        titleKey: 'home.marketingFeature4Title',
        descKey: 'home.marketingFeature4Desc',
        image:
          'https://www.kinderpedia.co/media/yootheme/cache/c6/childcare_billing_software_1280px-c6312ec2.webp',
      },
    ],
    [],
  )

  const stats = useMemo(
    () => [
      { valueKey: 'home.marketingStat1Value', labelKey: 'home.marketingStat1Label' },
      { valueKey: 'home.marketingStat2Value', labelKey: 'home.marketingStat2Label' },
      { valueKey: 'home.marketingStat3Value', labelKey: 'home.marketingStat3Label' },
      { valueKey: 'home.marketingStat4Value', labelKey: 'home.marketingStat4Label' },
    ],
    [],
  )

  const benefits = useMemo(
    () => [
      {
        icon: <MessageSquare className="w-6 h-6 text-indigo-500" />,
        textKey: 'home.marketingBenefit1',
      },
      {
        icon: <Calendar className="w-6 h-6 text-fuchsia-500" />,
        textKey: 'home.marketingBenefit2',
      },
      {
        icon: <Heart className="w-6 h-6 text-rose-500" />,
        textKey: 'home.marketingBenefit3',
      },
    ],
    [],
  )

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-x-hidden">
      <div className="absolute top-0 left-0 right-0 z-50 px-4 md:px-6 py-4 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-black/10 ring-2 ring-black/5 dark:ring-white/10 bg-card overflow-hidden">
            <Image src="/brand/kid-cloud-mark.png" alt="" width={40} height={40} className="w-10 h-10" priority />
          </div>
          <span className="font-bold text-lg md:text-xl tracking-tight text-slate-800 font-display hidden sm:block">{t('brand.appTitle')}</span>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <LanguageSwitcher />
          <Link href="/login">
            <IOSButton
              variant="secondary"
              size="small"
              className="bg-white/90 backdrop-blur-md border-indigo-100 text-indigo-700 hover:bg-indigo-50 text-xs font-bold"
            >
              {t('home.marketingCtaLogin')}
            </IOSButton>
          </Link>
          <Link href="/register" className="hidden sm:block">
            <IOSButton
              variant="primary"
              size="small"
              className="bg-linear-to-r from-indigo-600 to-fuchsia-600 border-0 text-xs font-bold"
            >
              {t('home.marketingCtaRegister')}
            </IOSButton>
          </Link>
        </div>
      </div>

      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-linear-to-b from-indigo-50/50 to-white">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-linear-to-br from-fuchsia-400/20 to-indigo-500/20 blur-[80px] animate-[pulse_8s_ease-in-out_infinite]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-linear-to-tr from-blue-400/20 to-teal-400/20 blur-[100px] animate-[pulse_10s_ease-in-out_infinite_reverse]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-indigo-100 shadow-xs mb-8 animate-[fadeInUp_0.8s_ease_out]">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500" aria-hidden />
            <span className="text-sm font-medium text-indigo-800">{t('home.marketingHeroBadge')}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-7xl font-extrabold font-display tracking-tight text-slate-900 leading-[1.1] mb-8 animate-[fadeInUp_1s_ease_out]">
            {t('home.marketingHeroLead')} <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-fuchsia-600">
              {t('home.marketingHeroAccent')}
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 mb-12 animate-[fadeInUp_1.2s_ease_out]">
            {t('home.marketingHeroSubtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-[fadeInUp_1.4s_ease_out]">
            <Link href="/register" className="w-full sm:w-auto">
              <IOSButton
                variant="primary"
                size="large"
                className="w-full sm:w-auto bg-linear-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700 border-0 shadow-xl shadow-indigo-500/20 group"
              >
                {t('home.marketingCtaRegister')}
                <ArrowRight className="w-4 h-4 ml-2 inline-block group-hover:translate-x-1 transition-transform" />
              </IOSButton>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <IOSButton
                variant="secondary"
                size="large"
                className="w-full sm:w-auto bg-white/80 backdrop-blur-md border-indigo-100 text-indigo-700 hover:bg-indigo-50"
              >
                {t('home.marketingCtaLogin')}
              </IOSButton>
            </Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 mt-20 animate-[fadeInUp_1.6s_ease_out]">
          <div className="relative rounded-2xl md:rounded-[40px] bg-white p-2 md:p-4 shadow-2xl shadow-indigo-900/10 border border-slate-100 overflow-hidden">
            <img
              src="https://www.kinderpedia.co/media/yootheme/cache/29/student_information_system_1280px-290d7e79.webp"
              alt={t('home.marketingHeroImageAlt')}
              className="w-full h-auto rounded-xl md:rounded-[32px] block shadow-inner"
            />
          </div>
        </div>
      </section>

      <section className="py-12 border-y border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, i) => (
              <div key={i} className={`text-center px-4 py-2 ${i % 2 === 1 && i < 3 ? 'border-l border-slate-100' : ''} ${i >= 2 ? 'border-t border-slate-100 md:border-t-0' : ''} md:border-l md:first:border-l-0`}>
                <div className="text-2xl md:text-4xl font-extrabold text-slate-800 mb-2 tracking-tight">
                  {t(stat.valueKey)}
                </div>
                <div className="text-xs md:text-sm font-medium text-slate-500">{t(stat.labelKey)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-sm font-bold tracking-widest text-indigo-600 uppercase mb-3">
              {t('home.marketingModulesEyebrow')}
            </h2>
            <h3 className="text-3xl md:text-5xl font-bold text-slate-900 font-display">
              {t('home.marketingModulesTitleLine1')} <br /> {t('home.marketingModulesTitleLine2')}
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group overflow-hidden flex flex-col"
              >
                <div className="p-8 md:p-10 flex-1">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                    {feature.icon}
                  </div>
                  <h4 className="text-2xl font-bold text-slate-900 mb-4 font-display">{t(feature.titleKey)}</h4>
                  <p className="text-slate-600 text-lg leading-relaxed mb-6">{t(feature.descKey)}</p>
                </div>
                <div className="px-8 pb-8">
                  <div className="rounded-2xl overflow-hidden border border-slate-50 shadow-inner bg-slate-50">
                    <img
                      src={feature.image}
                      alt={t(feature.titleKey)}
                      className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 relative">
            <div className="w-full aspect-square md:aspect-[4/5] rounded-[40px] overflow-hidden shadow-2xl relative border-8 border-white">
              <img
                src="https://www.kinderpedia.co/media/yootheme/cache/59/gradinita-bergman-05cf8571-593ee558.webp"
                alt={t('home.marketingPartnersImageAlt')}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-indigo-900/40 to-transparent" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold tracking-widest text-fuchsia-600 uppercase mb-3">
              {t('home.marketingPartnersEyebrow')}
            </h2>
            <h3 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 font-display">
              {t('home.marketingPartnersTitle')}
            </h3>
            <ul className="space-y-6">
              {benefits.map((item, i) => (
                <li key={i} className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shadow-xs">
                    {item.icon}
                  </div>
                  <span className="text-lg text-slate-700 font-medium">{t(item.textKey)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="py-24 relative overflow-hidden bg-indigo-900">
        <div className="absolute inset-0 bg-linear-to-br from-indigo-900 via-indigo-800 to-fuchsia-900 -z-10" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/5 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2" />

        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-4xl md:text-6xl font-bold mb-8 font-display">{t('home.marketingCtaBandTitle')}</h2>
          <p className="text-xl text-indigo-100 mb-12 opacity-90">{t('home.marketingCtaBandSubtitle')}</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/register">
              <IOSButton size="large" className="bg-white text-indigo-900 hover:bg-indigo-50 border-0 shadow-xl px-10 py-4 text-lg">
                {t('home.marketingCtaBandButton')}
              </IOSButton>
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center bg-indigo-600 rounded-lg text-white font-bold text-xs">
              {t('brand.shortName')}
            </div>
            <span className="font-semibold text-slate-900 tracking-tight font-display">{t('brand.appTitle')}</span>
          </div>
          <nav className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm font-medium text-slate-500" aria-label="Footer">
            <Link href="/privacy" className="hover:text-indigo-600 transition-colors">
              {t('common.privacy')}
            </Link>
            <Link href="/imprint" className="hover:text-indigo-600 transition-colors">
              {t('common.imprint')}
            </Link>
            <Link href="/security" className="hover:text-indigo-600 transition-colors">
              {t('common.security')}
            </Link>
            <Link href="/dpa" className="hover:text-indigo-600 transition-colors">
              {t('common.dpa')}
            </Link>
          </nav>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-8 text-center md:text-left text-sm text-ui-soft">
          © {new Date().getFullYear()} {t('home.marketingFooterRights')}
        </div>
      </footer>
    </main>
  )
}
