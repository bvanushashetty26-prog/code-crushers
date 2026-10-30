import React from 'react'
import Link from 'next/link'
import { CheckCircle, Circle, Clock, Flame, ChevronRight } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { Workout } from '@/lib/types'
import { WORKOUT_TYPE_BADGE_COLOR } from '@/components/ui/Badge'

interface RecentWorkoutsProps {
  workouts: Workout[]
}

export default function RecentWorkouts({ workouts }: RecentWorkoutsProps) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Recent Workouts</h2>
        <Link href="/history" className="text-sm text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
          View all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      {workouts.length === 0 ? (
        <div className="px-5 py-10 text-center text-slate-500 dark:text-slate-400 text-sm">
          No workouts yet. <Link href="/workouts/new" className="text-brand-600 underline">Add your first one!</Link>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
          {workouts.map(w => (
            <li key={w.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <div className="shrink-0">
                {w.completed
                  ? <CheckCircle className="w-5 h-5 text-emerald-500" />
                  : <Circle className="w-5 h-5 text-slate-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{w.name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {w.duration}m
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Flame className="w-3 h-3" /> {w.caloriesBurned} cal
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge color={WORKOUT_TYPE_BADGE_COLOR[w.type]} size="sm">{w.type}</Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
