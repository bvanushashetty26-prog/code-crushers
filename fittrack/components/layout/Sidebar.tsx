import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  LayoutDashboard,
  Dumbbell,
  Target,
  TrendingUp,
  History,
  Bot,
  User,
  Menu,
  X,
  Zap,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard',  href: '/',           icon: LayoutDashboard },
  { label: 'Workouts',   href: '/workouts',    icon: Dumbbell },
  { label: 'Goals',      href: '/goals',       icon: Target },
  { label: 'Progress',   href: '/progress',    icon: TrendingUp },
  { label: 'History',    href: '/history',     icon: History },
  { label: 'AI Assistant', href: '/assistant', icon: Bot },
  { label: 'Profile',    href: '/profile',     icon: User },
]

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
}

function NavItem({ href, icon: Icon, label, onClick }: {
  href: string; icon: typeof LayoutDashboard; label: string; onClick?: () => void
}) {
  const { pathname } = useRouter()
  const active = pathname === href || (href !== '/' && pathname.startsWith(href))
  return (
    <Link
      href={href}
      onClick={onClick}
      className={[
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
        active
          ? 'bg-brand-600 text-white shadow-sm'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white',
      ].join(' ')}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span>{label}</span>
    </Link>
  )
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-600 shadow-sm">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-lg font-bold text-slate-900 dark:text-white">FitTrack</span>
          <p className="text-xs text-slate-500 dark:text-slate-400 -mt-0.5">Your fitness companion</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <NavItem key={item.href} {...item} onClick={mobileOpen ? onClose : undefined} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-700">
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center">FitTrack v1.0</p>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 h-screen sticky top-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-hidden">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <aside className="relative w-72 max-w-[85vw] h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col shadow-2xl">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
