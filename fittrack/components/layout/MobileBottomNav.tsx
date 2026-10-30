import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { LayoutDashboard, Dumbbell, Target, TrendingUp, Bot } from 'lucide-react'

const ITEMS = [
  { href: '/',          icon: LayoutDashboard, label: 'Home' },
  { href: '/workouts',  icon: Dumbbell,        label: 'Workouts' },
  { href: '/goals',     icon: Target,          label: 'Goals' },
  { href: '/progress',  icon: TrendingUp,      label: 'Progress' },
  { href: '/assistant', icon: Bot,             label: 'AI' },
]

export default function MobileBottomNav() {
  const { pathname } = useRouter()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 safe-area-inset-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                active
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : ''}`} />
              <span className={`text-xs ${active ? 'font-semibold' : 'font-normal'}`}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
