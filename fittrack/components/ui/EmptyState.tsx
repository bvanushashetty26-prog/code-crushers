import React from 'react'
import { LucideIcon } from 'lucide-react'
import Button from './Button'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 mb-4">
          <Icon className="w-8 h-8 text-slate-400" />
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-5">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm">{actionLabel}</Button>
      )}
    </div>
  )
}
