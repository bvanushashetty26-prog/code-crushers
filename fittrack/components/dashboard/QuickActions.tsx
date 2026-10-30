import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Plus, Target, TrendingUp, Bot, Dumbbell } from 'lucide-react'
import Card from '@/components/ui/Card'

const ACTIONS = [
  { label: 'Add Workout', href: '/workouts/new', icon: Plus, bg: 'bg-brand-600 hover:bg-brand-700', text: 'text-white' },
  { label: 'Create Goal', href: '/goals', icon: Target, bg: 'bg-violet-600 hover:bg-violet-700', text: 'text-white' },
  { label: 'View Progress', href: '/progress', icon: TrendingUp, bg: 'bg-emerald-600 hover:bg-emerald-700', text: 'text-white' },
  { label: 'AI Assistant', href: '/assistant', icon: Bot, bg: 'bg-amber-500 hover:bg-amber-600', text: 'text-white' },
]

export default function QuickActions() {
  return (
    <Card>
      <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-3">Quick Actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ACTIONS.map(({ label, href, icon: Icon, bg, text }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${bg} ${text} shadow-sm`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium text-center leading-tight">{label}</span>
          </Link>
        ))}
      </div>
    </Card>
  )
}
