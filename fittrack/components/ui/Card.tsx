import React, { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const PAD: Record<string, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

export default function Card({
  padding = 'md',
  className = '',
  children,
  ...rest
}: CardProps) {
  return (
    <div
      {...rest}
      className={[
        'bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm',
        PAD[padding],
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
