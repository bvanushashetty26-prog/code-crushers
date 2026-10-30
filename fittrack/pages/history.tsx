import React, { useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Card from '@/components/ui/Card'
import Badge, { WORKOUT_TYPE_BADGE_COLOR } from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { useApp } from '@/context/AppContext'
import { formatDate } from '@/lib/utils'
import { Workout } from '@/lib/types'
import { History, Search, CheckCircle, Circle, Clock, Flame, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import WorkoutCard from '@/components/workouts/WorkoutCard'

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'Strength', label: 'Strength' },
  { value: 'Cardio',   label: 'Cardio' },
  { value: 'Running',  label: 'Running' },
  { value: 'Cycling',  label: 'Cycling' },
  { value: 'Yoga',     label: 'Yoga' },
  { value: 'Other',    label: 'Other' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
]

const PAGE_SIZE = 10

export default function HistoryPage() {
  const { workouts, loading } = useApp()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)

  if (loading) return <AppLayout title="Workout History"><LoadingSpinner /></AppLayout>

  const filtered = [...workouts]
    .filter(w => !search || w.name.toLowerCase().includes(search.toLowerCase()))
    .filter(w => !typeFilter || w.type === typeFilter)
    .filter(w => !statusFilter || (statusFilter === 'completed' ? w.completed : !w.completed))
    .filter(w => !fromDate || w.date >= fromDate)
    .filter(w => !toDate || w.date <= toDate)
    .sort((a, b) => b.date.localeCompare(a.date))

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function resetFilters() {
    setSearch(''); setTypeFilter(''); setStatusFilter(''); setFromDate(''); setToDate(''); setPage(1)
  }

  const hasFilters = search || typeFilter || statusFilter || fromDate || toDate

  return (
    <AppLayout title="Workout History">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Workout History</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{filtered.length} workout{filtered.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <Select options={TYPE_OPTIONS} value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }} />
          <Select options={STATUS_OPTIONS} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} />
          <div className="flex gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={e => { setFromDate(e.target.value); setPage(1) }}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              title="From date"
            />
          </div>
        </div>
        {/* Second row: to date + reset */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <input
            type="date"
            value={toDate}
            onChange={e => { setToDate(e.target.value); setPage(1) }}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            title="To date"
          />
          {fromDate && <span className="text-sm text-slate-500 dark:text-slate-400">to</span>}
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>Clear filters</Button>
          )}
        </div>
      </Card>

      {/* Results */}
      {paged.length === 0 ? (
        <EmptyState
          icon={History}
          title="No workouts found"
          description={hasFilters ? 'Try adjusting your search or filters.' : 'No workout history yet. Start logging your workouts!'}
          actionLabel={hasFilters ? 'Clear filters' : undefined}
          onAction={hasFilters ? resetFilters : undefined}
        />
      ) : (
        <>
          {/* Table: desktop */}
          <div className="hidden md:block">
            <Card padding="none" className="overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Workout</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Duration</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Calories</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {paged.map(w => (
                    <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{w.name}</td>
                      <td className="px-4 py-3">
                        <Badge color={WORKOUT_TYPE_BADGE_COLOR[w.type]} size="sm">{w.type}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{w.duration}m</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{w.caloriesBurned} cal</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDate(w.date)}</td>
                      <td className="px-4 py-3">
                        {w.completed
                          ? <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium"><CheckCircle className="w-4 h-4" /> Done</span>
                          : <span className="flex items-center gap-1 text-slate-400"><Circle className="w-4 h-4" /> Pending</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          {/* Cards: mobile */}
          <div className="md:hidden space-y-3">
            {paged.map(w => <WorkoutCard key={w.id} workout={w} />)}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Page {page} of {totalPages} · {filtered.length} results
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </AppLayout>
  )
}
