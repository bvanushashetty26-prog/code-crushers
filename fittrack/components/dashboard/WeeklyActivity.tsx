import React from 'react'
import Card from '@/components/ui/Card'
import { WeekDayData } from '@/lib/utils'

interface WeeklyActivityProps {
  data: WeekDayData[]
}

export default function WeeklyActivity({ data }: WeeklyActivityProps) {
  const maxWorkouts = Math.max(...data.map(d => d.workouts), 1)

  return (
    <Card>
      <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">This Week</h2>
      <div className="flex items-end justify-between gap-1 h-20">
        {data.map((day, i) => {
          const heightPct = day.workouts === 0 ? 8 : (day.workouts / maxWorkouts) * 100
          const today = new Date().getDay() === i
          return (
            <div key={day.day} className="flex flex-col items-center gap-1 flex-1">
              <div className="w-full flex items-end justify-center" style={{ height: '64px' }}>
                <div
                  className={`w-full max-w-[32px] rounded-t-md transition-all ${
                    today
                      ? 'bg-brand-600'
                      : day.workouts > 0
                      ? 'bg-brand-300 dark:bg-brand-700'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                  style={{ height: `${heightPct}%` }}
                  title={`${day.workouts} workout${day.workouts !== 1 ? 's' : ''}`}
                />
              </div>
              <span className={`text-xs ${today ? 'text-brand-600 dark:text-brand-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                {day.day}
              </span>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
        {data.reduce((s, d) => s + d.workouts, 0)} workouts · {data.reduce((s, d) => s + d.duration, 0)} min · {data.reduce((s, d) => s + d.calories, 0).toLocaleString()} cal
      </p>
    </Card>
  )
}
