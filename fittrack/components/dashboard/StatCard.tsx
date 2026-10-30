import React from 'react'
import { LucideIcon } from 'lucide-react'
import Card from '@/components/ui/Card'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  trend?: { value: string; positive?: boolean }
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-brand-600',
  iconBg = 'bg-brand-50 dark:bg-brand-900/20',
  trend,
}: StatCardProps) {
  return (
    <Card className="flex items-start gap-4">
      <div className={`flex items-center justify-center w-12 h-12 rounded-xl shrink-0 ${iconBg}`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{title}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5 leading-tight">{value}</p>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        {trend && (
          <span className={`inline-flex items-center text-xs font-medium mt-1 ${trend.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
    </Card>
  )
}
