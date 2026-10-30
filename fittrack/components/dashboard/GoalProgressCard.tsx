import React from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import ProgressBar from '@/components/ui/ProgressBar'
import { Goal } from '@/lib/types'
import { ChevronRight } from 'lucide-react'

interface GoalProgressCardProps {
  goals: Goal[]
}

const PROGRESS_COLORS = ['blue', 'green', 'amber', 'purple'] as const

export default function GoalProgressCard({ goals }: GoalProgressCardProps) {
  const active = goals.filter(g => !g.completed).slice(0, 3)

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Goal Progress</h2>
        <Link href="/goals" className="text-sm text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
          Manage <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      {active.length === 0 ? (
        <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
          No active goals. <Link href="/goals" className="text-brand-600 underline">Create one!</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {active.map((goal, i) => {
            const pct = goal.targetValue === 0 ? 0 : Math.round((goal.currentValue / goal.targetValue) * 100)
            const color = PROGRESS_COLORS[i % PROGRESS_COLORS.length]
            return (
              <div key={goal.id}>
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate flex-1 mr-2">
                    {goal.title}
                  </span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
                    {goal.currentValue}/{goal.targetValue} {goal.unit}
                  </span>
                </div>
                <ProgressBar value={pct} color={color} size="md" />
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
