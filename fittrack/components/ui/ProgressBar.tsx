import React from 'react'

interface ProgressBarProps {
  value: number          // 0–100
  color?: 'blue' | 'green' | 'amber' | 'purple' | 'pink' | 'red'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const COLOR_MAP = {
  blue:   'bg-brand-500',
  green:  'bg-emerald-500',
  amber:  'bg-amber-500',
  purple: 'bg-violet-500',
  pink:   'bg-pink-500',
  red:    'bg-red-500',
}

const SIZE_MAP = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-3.5' }

export default function ProgressBar({
  value,
  color = 'blue',
  size = 'md',
  showLabel = false,
  className = '',
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between mb-1 text-xs text-slate-500 dark:text-slate-400">
          <span>Progress</span>
          <span className="font-medium">{Math.round(clamped)}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden ${SIZE_MAP[size]}`}>
        <div
          className={`${SIZE_MAP[size]} ${COLOR_MAP[color]} rounded-full transition-all duration-500`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
