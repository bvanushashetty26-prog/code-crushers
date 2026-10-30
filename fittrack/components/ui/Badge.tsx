import React from 'react'
import { WorkoutType } from '@/lib/types'

type Color = 'blue' | 'green' | 'amber' | 'purple' | 'pink' | 'gray' | 'red' | 'teal'

interface BadgeProps {
  children: React.ReactNode
  color?: Color
  size?: 'sm' | 'md'
}

const COLOR_MAP: Record<Color, string> = {
  blue:   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  green:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  amber:  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  purple: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  pink:   'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  gray:   'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  red:    'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  teal:   'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
}

const SIZE_MAP = { sm: 'px-2 py-0.5 text-xs', md: 'px-2.5 py-1 text-xs' }

export const WORKOUT_TYPE_BADGE_COLOR: Record<WorkoutType, Color> = {
  Strength: 'blue',
  Cardio:   'green',
  Running:  'amber',
  Cycling:  'purple',
  Yoga:     'pink',
  Other:    'gray',
}

export default function Badge({ children, color = 'gray', size = 'md' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${COLOR_MAP[color]} ${SIZE_MAP[size]}`}>
      {children}
    </span>
  )
}
