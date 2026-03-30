'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/i18n/I18nProvider'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import {
  LayoutDashboard, Settings, Globe, Users, Briefcase, User, CheckSquare, 
  CalendarDays, ClipboardList, FileText, CheckCircle, FileSignature, 
  Eye, Book, Palette, Clock, Utensils, Receipt, CreditCard, Wrench, 
  Umbrella, MessageSquare, ListTodo, Bed, ShoppingCart, BarChart3, LogOut, Baby
} from 'lucide-react'
import { ThemeToggle } from '@/components/common/ThemeToggle'

interface AppSidebarProps {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

type NavItem = {
  path: string
  labelKey: string
  icon: React.ReactNode
}

export function AppSidebar({ collapsed: controlledCollapsed, onCollapsedChange }: AppSidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const pathname = usePathname()
  const { profile, loading } = useAuth()
  const { t } = useI18n()

  const isCollapsed = controlledCollapsed ?? internalCollapsed

  const toggleCollapse = () => {
    if (onCollapsedChange) {
      onCollapsedChange(!isCollapsed)
    } else {
      setInternalCollapsed(!isCollapsed)
    }
  }

  const role = profile?.role
  const navItems: NavItem[] = []
  
  const iconProps = { size: 20, className: "shrink-0 transition-transform duration-200 group-hover:scale-110" }

  if (!role) {
    navItems.push({ path: '/dashboard', labelKey: 'nav.gen.dashboard', icon: <LayoutDashboard {...iconProps} /> })
  } else if (role === 'admin') {
    navItems.push(
      { path: '/admin/dashboard', labelKey: 'nav.admin.dashboard', icon: <LayoutDashboard {...iconProps} /> },
      { path: '/admin/setup', labelKey: 'nav.admin.setup', icon: <Settings {...iconProps} /> },
      { path: '/admin/site', labelKey: 'nav.admin.site', icon: <Globe {...iconProps} /> },
      { path: '/admin/children', labelKey: 'nav.admin.children', icon: <Baby {...iconProps} /> },
      { path: '/admin/groups', labelKey: 'nav.admin.groups', icon: <Users {...iconProps} /> },
      { path: '/admin/staff', labelKey: 'nav.admin.staff', icon: <Briefcase {...iconProps} /> },
      { path: '/admin/users', labelKey: 'nav.admin.users', icon: <User {...iconProps} /> },
      { path: '/admin/attendance', labelKey: 'nav.admin.attendance', icon: <CheckSquare {...iconProps} /> },
      { path: '/admin/calendar', labelKey: 'nav.admin.calendar', icon: <CalendarDays {...iconProps} /> },
      { path: '/admin/applications', labelKey: 'nav.admin.applications', icon: <ClipboardList {...iconProps} /> },
      { path: '/admin/contracts', labelKey: 'nav.admin.contracts', icon: <FileText {...iconProps} /> },
      { path: '/admin/consents', labelKey: 'nav.admin.consents', icon: <CheckCircle {...iconProps} /> },
      { path: '/admin/daily-reports', labelKey: 'nav.admin.dailyReports', icon: <FileSignature {...iconProps} /> },
      { path: '/admin/observations', labelKey: 'nav.admin.observations', icon: <Eye {...iconProps} /> },
      { path: '/admin/portfolios', labelKey: 'nav.admin.portfolios', icon: <Book {...iconProps} /> },
      { path: '/admin/learning-themes', labelKey: 'nav.admin.learningThemes', icon: <Palette {...iconProps} /> },
      { path: '/admin/daily-routines', labelKey: 'nav.admin.dailyRoutines', icon: <Clock {...iconProps} /> },
      { path: '/admin/lunch/menus', labelKey: 'nav.admin.lunchMenus', icon: <Utensils {...iconProps} /> },
      { path: '/admin/lunch/billing', labelKey: 'nav.admin.lunchBilling', icon: <Receipt {...iconProps} /> },
      { path: '/admin/fees', labelKey: 'nav.admin.fees', icon: <CreditCard {...iconProps} /> },
      { path: '/admin/parent-work', labelKey: 'nav.admin.parentWork', icon: <Wrench {...iconProps} /> },
      { path: '/admin/leave', labelKey: 'nav.admin.leave', icon: <Umbrella {...iconProps} /> },
      { path: '/admin/hr/payroll', labelKey: 'nav.admin.hrPayroll', icon: <Briefcase {...iconProps} /> },
      { path: '/admin/messages', labelKey: 'nav.admin.messages', icon: <MessageSquare {...iconProps} /> },
      { path: '/admin/settings', labelKey: 'nav.admin.settings', icon: <Settings {...iconProps} /> }
    )
  } else if (role === 'teacher') {
    navItems.push(
      { path: '/teacher/dashboard', labelKey: 'nav.teacher.dashboard', icon: <LayoutDashboard {...iconProps} /> },
      { path: '/teacher/todo', labelKey: 'nav.teacher.todo', icon: <ListTodo {...iconProps} /> },
      { path: '/teacher/children', labelKey: 'nav.teacher.children', icon: <Baby {...iconProps} /> },
      { path: '/teacher/attendance', labelKey: 'nav.teacher.attendance', icon: <CheckSquare {...iconProps} /> },
      { path: '/teacher/daily-reports', labelKey: 'nav.teacher.dailyReports', icon: <FileSignature {...iconProps} /> },
      { path: '/teacher/observations', labelKey: 'nav.teacher.observations', icon: <Eye {...iconProps} /> },
      { path: '/teacher/portfolios', labelKey: 'nav.teacher.portfolios', icon: <Book {...iconProps} /> },
      { path: '/teacher/nap-records', labelKey: 'nav.teacher.napRecords', icon: <Bed {...iconProps} /> },
      { path: '/teacher/calendar', labelKey: 'nav.teacher.calendar', icon: <CalendarDays {...iconProps} /> },
      { path: '/teacher/leave', labelKey: 'nav.teacher.leave', icon: <Umbrella {...iconProps} /> },
      { path: '/teacher/payroll', labelKey: 'nav.teacher.payroll', icon: <Briefcase {...iconProps} /> },
      { path: '/teacher/messages', labelKey: 'nav.teacher.messages', icon: <MessageSquare {...iconProps} /> }
    )
  } else if (role === 'parent') {
    navItems.push(
      { path: '/parent/dashboard', labelKey: 'nav.parent.dashboard', icon: <LayoutDashboard {...iconProps} /> },
      { path: '/parent/children', labelKey: 'nav.parent.children', icon: <Baby {...iconProps} /> },
      { path: '/parent/attendance', labelKey: 'nav.parent.attendance', icon: <CheckSquare {...iconProps} /> },
      { path: '/parent/daily-reports', labelKey: 'nav.parent.dailyReports', icon: <FileSignature {...iconProps} /> },
      { path: '/parent/observations', labelKey: 'nav.parent.observations', icon: <Eye {...iconProps} /> },
      { path: '/parent/portfolios', labelKey: 'nav.parent.portfolios', icon: <Book {...iconProps} /> },
      { path: '/parent/learning-themes', labelKey: 'nav.parent.learningThemes', icon: <Palette {...iconProps} /> },
      { path: '/parent/absences', labelKey: 'nav.parent.absences', icon: <Umbrella {...iconProps} /> },
      { path: '/parent/calendar', labelKey: 'nav.parent.calendar', icon: <CalendarDays {...iconProps} /> },
      { path: '/parent/lunch', labelKey: 'nav.parent.lunch', icon: <Utensils {...iconProps} /> },
      { path: '/parent/fees', labelKey: 'nav.parent.fees', icon: <CreditCard {...iconProps} /> },
      { path: '/parent/work', labelKey: 'nav.parent.parentWork', icon: <Wrench {...iconProps} /> },
      { path: '/parent/messages', labelKey: 'nav.parent.messages', icon: <MessageSquare {...iconProps} /> }
    )
  } else if (role === 'kitchen') {
    navItems.push(
      { path: '/kitchen/dashboard', labelKey: 'nav.kitchen.dashboard', icon: <LayoutDashboard {...iconProps} /> },
      { path: '/kitchen/menus', labelKey: 'nav.kitchen.menus', icon: <Utensils {...iconProps} /> },
      { path: '/kitchen/orders', labelKey: 'nav.kitchen.orders', icon: <ShoppingCart {...iconProps} /> }
    )
  } else if (role === 'support') {
    navItems.push(
      { path: '/support/dashboard', labelKey: 'nav.support.dashboard', icon: <LayoutDashboard {...iconProps} /> },
      { path: '/support/attendance', labelKey: 'nav.support.attendance', icon: <CheckSquare {...iconProps} /> },
      { path: '/support/children', labelKey: 'nav.support.children', icon: <Baby {...iconProps} /> },
      { path: '/support/messages', labelKey: 'nav.support.messages', icon: <MessageSquare {...iconProps} /> },
      { path: '/support/reports', labelKey: 'nav.support.reports', icon: <BarChart3 {...iconProps} /> },
      { path: '/support/payroll', labelKey: 'nav.support.payroll', icon: <Briefcase {...iconProps} /> }
    )
  }

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

  const roleLabelKey =
    role === 'admin' || role === 'teacher' || role === 'parent' || role === 'kitchen' || role === 'support'
      ? (`roles.${role}` as const)
      : null
  const userRoleLabel = loading ? t('roles.loadingRole') : roleLabelKey ? t(roleLabelKey) : t('roles.roleUnset')

  return (
    <div className={`h-full flex flex-col bg-background text-foreground transition-all duration-300 border-r border-slate-100 dark:border-white/5 z-50 ${isCollapsed ? 'w-20' : 'w-full'}`}>
      <div className="px-5 py-8 flex items-center justify-between border-b border-slate-50 dark:border-white/5 bg-background">
        <div className="flex items-center gap-3 min-w-0 overflow-hidden">
          <div className="shrink-0 w-10 h-10 bg-linear-to-br from-indigo-600 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-100">
            KG
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0 transition-opacity duration-300">
              <p className="text-sm font-bold text-slate-900 tracking-tight truncate">{t('brand.appTitle')}</p>
              <p className="text-[10px] text-indigo-500 font-bold tracking-widest uppercase mt-0.5">
                {loading ? '...' : userRoleLabel}
              </p>
            </div>
          )}
        </div>
          navItems.map((item) => {
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mb-1 focus:outline-none focus:ring-2 focus:ring-indigo-100 ${
                  active 
                    ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                title={isCollapsed ? t(item.labelKey) : undefined}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full" />
                )}
                
                <span className={`${active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500 transition-colors'}`}>
                  {item.icon}
                </span>
                
                {!isCollapsed && (
                  <span className="truncate flex-1 tracking-tight">{t(item.labelKey)}</span>
                )}
              </Link>
            )
          })
        )}
      </nav>

      <div className="border-t border-slate-50 dark:border-white/5 p-4 flex flex-col gap-3 mt-auto bg-slate-50/50 dark:bg-white/5">
        <Link
          href="/logout"
          className={`flex items-center gap-3 justify-center w-full px-3 py-2.5 rounded-xl text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 transition-all focus:ring-2 focus:ring-rose-100 ${isCollapsed ? 'px-0' : ''}`}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <LogOut size={18} className="shrink-0" />
          {!isCollapsed && <span className="truncate tracking-tight">Logout</span>}
        </Link>
        {!isCollapsed && (
          <div className="pt-2 flex flex-col gap-3">
            <div className="flex justify-center">
              <ThemeToggle />
            </div>
            <LanguageSwitcher className="w-full justify-center brightness-100" />
          </div>
        )}
      </div>
    </div>
  )
}
