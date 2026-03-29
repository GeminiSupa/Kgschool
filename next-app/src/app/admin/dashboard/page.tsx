'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'
import { getActiveKitaId } from '@/utils/tenant/client'
import { ThemeToggle } from '@/components/common/ThemeToggle'

const ROUTE = 'admin.dashboard'

export default function AdminDashboardPage() {
  const { t } = useI18n()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [kitaMissing, setKitaMissing] = useState(false)
  const [todayMenu, setTodayMenu] = useState<any>(null)

  const [stats, setStats] = useState({
    totalChildren: 0,
    activeGroups: 0,
    totalStaff: 0,
    todayAttendance: 0,
    pendingLeaveRequests: 0,
    totalUsers: 0
  })

  useEffect(() => {
    async function fetchAdminData() {
      try {
        const kitaId = await getActiveKitaId()
        if (!kitaId) {
          setKitaMissing(true)
          return
        }

        setKitaMissing(false)
        const today = new Date().toISOString().split('T')[0]

        // Batch count queries
        const [childrenRes, groupsRes, membersRes, attendanceRes, leaveRes] = await Promise.all([
          supabase.from('children').select('id', { count: 'exact', head: true }).eq('kita_id', kitaId),
          supabase.from('groups').select('id', { count: 'exact', head: true }).eq('kita_id', kitaId),
          supabase.from('organization_members').select('profile_id').eq('kita_id', kitaId),
          supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('date', today).eq('status', 'present'),
          supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending')
        ])

        const memberProfileIds = [...new Set(membersRes.data?.map((m) => m.profile_id).filter(Boolean) ?? [])] as string[]
        
        const staffRes = memberProfileIds.length > 0
          ? await supabase.from('profiles').select('id', { count: 'exact', head: true }).in('id', memberProfileIds).in('role', ['teacher', 'kitchen', 'support'])
          : { count: 0 }

        setStats({
          totalChildren: childrenRes.count ?? 0,
          activeGroups: groupsRes.count ?? 0,
          totalStaff: staffRes.count ?? 0,
          todayAttendance: attendanceRes.count ?? 0,
          pendingLeaveRequests: leaveRes.count ?? 0,
          totalUsers: memberProfileIds.length
        })

        // Fetch Today's Menu
        const { data: menuData } = await supabase
          .from('lunch_menus')
          .select('*')
          .eq('date', today)
          .eq('kita_id', kitaId)
          .maybeSingle()
        
        setTodayMenu(menuData)
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAdminData()
  }, [supabase])

  const quickLinks = [
    { href: '/admin/children', labelKey: 'qlManageChildren', icon: '👶', color: 'bg-aura-indigo/10 text-aura-indigo' },
    { href: '/admin/staff', labelKey: 'qlManageStaff', icon: '👥', color: 'bg-aura-coral/10 text-aura-coral' },
    { href: '/admin/groups', labelKey: 'qlManageGroups', icon: '👪', color: 'bg-aura-mint/10 text-aura-mint' },
    { href: '/admin/messages', labelKey: 'qlMessages', icon: '💬', color: 'bg-aura-rose/10 text-aura-rose' },
    { href: '/admin/fees', labelKey: 'qlFees', icon: '💰', color: 'bg-amber-400/10 text-amber-600' },
  ]

  if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><LoadingSpinner /></div>

  return (
    <div className="min-h-screen bg-mesh-light -mt-8 -mx-8 px-8 py-12 animate-in fade-in duration-1000">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 px-4">
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-aura-indigo/60">Management Hub</h4>
            <h1 className="text-5xl font-display font-black text-slate-900 dark:text-white tracking-tight leading-none">
                Guten Tag, <span className="text-aura-indigo">Admin</span> 👋
            </h1>
            <p className="text-lg text-slate-400 font-medium">Dein Kindergarten auf einen Blick.</p>
          </div>
          <div className="flex items-center gap-4">
             <ThemeToggle />
             <Link href="/admin/children/new" className="px-8 py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl hover:-translate-y-1 transition-all active:scale-95">
                {t(pT(ROUTE, 'addChild'))}
             </Link>
          </div>
        </header>

        {kitaMissing && (
           <div className="mb-12 glass p-6 rounded-3xl border-aura-coral/20 bg-aura-coral/5 text-aura-coral text-sm font-bold flex items-center gap-4 animate-bounce">
              <span>⚠️ Keine Kita zugeordnet. Bitte Support kontaktieren.</span>
           </div>
        )}

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6 px-2">
          
          {/* Main Stat Card - Children */}
          <div className="md:col-span-2 lg:col-span-2 aspect-square">
             <GlassStatCard 
                title="Kinder" 
                value={stats.totalChildren} 
                icon="👶" 
                color="indigo" 
                trend="+12%"
             />
          </div>

          {/* Today's Menu Highlight - Wide Bento */}
          <div className="md:col-span-4 lg:col-span-4 h-full">
             {todayMenu ? (
                <Link href="/admin/lunch/menus" className="block h-full">
                   <div className="glass h-full p-8 rounded-premium flex flex-col md:flex-row gap-8 group hover:shadow-2xl transition-all duration-700 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                         <span className="text-9xl">🍽️</span>
                      </div>
                      <div className="md:w-1/2 rounded-2xl overflow-hidden shadow-2xl relative min-h-[200px]">
                         {todayMenu.photo_url ? (
                            <img src={todayMenu.photo_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="Lunch" />
                         ) : (
                            <div className="w-full h-full bg-linear-to-br from-aura-coral to-aura-indigo opacity-80 flex items-center justify-center text-6xl">🍛</div>
                         )}
                         <div className="absolute top-4 left-4 glass px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg">Heutiges Menü</div>
                      </div>
                      <div className="md:w-1/2 flex flex-col justify-center gap-4">
                         <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-tight group-hover:text-aura-indigo transition-colors uppercase italic">{todayMenu.meal_name}</h3>
                         <p className="text-slate-400 font-medium line-clamp-3">{todayMenu.description || 'Frisch zubereitetes Mittagessen für unsere Kleinen.'}</p>
                         <div className="flex gap-2 mt-4">
                            {todayMenu.allergens?.map((a: string) => (
                               <span key={a} className="px-2 py-1 bg-white/50 dark:bg-white/10 rounded-lg text-[9px] font-black uppercase text-slate-500 dark:text-slate-400">{a}</span>
                            ))}
                         </div>
                      </div>
                   </div>
                </Link>
             ) : (
                <div className="glass h-full p-8 rounded-premium flex items-center justify-center text-center opacity-60">
                   <div>
                      <span className="text-4xl mb-4 block">🥣</span>
                      <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Noch kein Menü für heute erfasst</p>
                   </div>
                </div>
             )}
          </div>

          {/* Bento Group 2 */}
          <div className="md:col-span-2 grid grid-cols-2 gap-6 h-full">
              <GlassStatCard title="Gruppen" value={stats.activeGroups} icon="👪" color="mint" />
              <GlassStatCard title="Team" value={stats.totalStaff} icon="👥" color="coral" />
              <div className="col-span-2">
                 <GlassStatCard title="Anwesenheit Heute" value={stats.todayAttendance} icon="✅" color="indigo" variant="wide" />
              </div>
          </div>

          {/* Quick Access Bento Section */}
          <div className="md:col-span-4 lg:col-span-4">
             <div className="glass p-8 rounded-premium h-full">
                <div className="flex items-center justify-between mb-8">
                   <h2 className="text-[10px] font-black text-slate-400 tracking-[0.4em] uppercase">Schnellzugriff</h2>
                   <span className="w-8 h-8 rounded-full bg-aura-indigo/10 flex items-center justify-center text-aura-indigo">⚙️</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                   {quickLinks.map((link) => (
                      <Link key={link.href} href={link.href} className="group flex flex-col items-center">
                         <div className={`w-full aspect-square rounded-[32px] ${link.color} flex flex-col items-center justify-center gap-3 hover:scale-105 hover:-translate-y-1 transition-all duration-300 shadow-sm border border-white/20 dark:border-white/5 active:scale-95`}>
                            <span className="text-3xl transition-transform group-hover:scale-125 duration-500">{link.icon}</span>
                            <span className="text-[10px] font-black uppercase tracking-tighter text-center px-2 opacity-80 dark:text-white">{t(pT(ROUTE, link.labelKey))}</span>
                         </div>
                      </Link>
                   ))}
                </div>
             </div>
          </div>

          {/* Activity Strip */}
          <div className="md:col-span-4 lg:col-span-6 mt-4">
             <div className="glass p-1 h-16 rounded-full flex items-center px-10 gap-6 overflow-hidden">
                <span className="text-aura-rose animate-pulse">●</span>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex-1">
                   {stats.pendingLeaveRequests > 0 
                     ? `${stats.pendingLeaveRequests} Ausstehende Abwesenheitsanträge zur Prüfung` 
                     : "Alles auf dem neuesten Stand. Keine ausstehenden Anfragen."
                   }
                </p>
                {stats.pendingLeaveRequests > 0 && (
                   <Link href="/admin/leave" className="text-[10px] font-black uppercase text-aura-indigo hover:underline">Ansehen →</Link>
                )}
             </div>
          </div>

        </div>

      </div>
    </div>
  )
}

function GlassStatCard({ 
    title, 
    value, 
    icon, 
    color, 
    trend, 
    variant = 'square' 
}: { 
    title: string; 
    value: number; 
    icon: string; 
    color: 'indigo' | 'coral' | 'mint' | 'rose';
    trend?: string;
    variant?: 'square' | 'wide';
}) {
    const colorClasses = {
        indigo: 'text-aura-indigo bg-aura-indigo/10 shadow-aura-indigo/5',
        coral: 'text-aura-coral bg-aura-coral/10 shadow-aura-coral/5',
        mint: 'text-aura-mint bg-aura-mint/10 shadow-aura-mint/5',
        rose: 'text-aura-rose bg-aura-rose/10 shadow-aura-rose/5'
    }

    return (
        <div className={`glass h-full p-8 rounded-premium flex flex-col justify-between hover:scale-[1.02] transition-all duration-500 border-white/50 group ${variant === 'wide' ? 'flex-row items-center gap-8' : ''}`}>
           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${colorClasses[color]} group-hover:scale-110 transition-transform shadow-lg`}>
              {icon}
           </div>
           <div className={variant === 'wide' ? 'flex-1 grow flex items-center justify-between' : ''}>
              <div className="mt-4">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{title}</p>
                 <div className="flex items-baseline gap-3">
                    <h2 className="text-5xl font-black text-slate-800 dark:text-white tracking-tighter">{value}</h2>
                    {trend && <span className="text-aura-mint font-black text-[10px] px-2 py-0.5 bg-aura-mint/10 rounded-full">{trend}</span>}
                 </div>
              </div>
           </div>
        </div>
    )
}
