import React, { useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import WorkoutCard from '@/components/workouts/WorkoutCard'
import WorkoutForm from '@/components/workouts/WorkoutForm'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import { useApp } from '@/context/AppContext'
import { Workout, WorkoutType } from '@/lib/types'
import { Plus, Dumbbell, Search } from 'lucide-react'

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'Strength', label: 'Strength' },
  { value: 'Cardio',   label: 'Cardio' },
  { value: 'Running',  label: 'Running' },
  { value: 'Cycling',  label: 'Cycling' },
  { value: 'Yoga',     label: 'Yoga' },
  { value: 'Other',    label: 'Other' },
]

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Newest first' },
  { value: 'date-asc',  label: 'Oldest first' },
  { value: 'name-asc',  label: 'Name A–Z' },
  { value: 'cal-desc',  label: 'Most calories' },
]

export default function WorkoutsPage() {
  const { workouts, addWorkout, loading } = useApp()
  const [addOpen, setAddOpen] = useState(false)
  const [typeFilter, setTypeFilter] = useState('')
  const [sortBy, setSortBy] = useState('date-desc')
  const [search, setSearch] = useState('')

  function handleAdd(data: Omit<Workout, 'id' | 'createdAt'>) {
    addWorkout(data)
    setAddOpen(false)
  }

  const filtered = workouts
    .filter(w => !typeFilter || w.type === typeFilter)
    .filter(w => !search || w.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'date-desc') return b.date.localeCompare(a.date)
      if (sortBy === 'date-asc')  return a.date.localeCompare(b.date)
      if (sortBy === 'name-asc')  return a.name.localeCompare(b.name)
      if (sortBy === 'cal-desc')  return b.caloriesBurned - a.caloriesBurned
      return 0
    })

  if (loading) return <AppLayout title="Workouts"><LoadingSpinner /></AppLayout>

  return (
    <AppLayout title="Workouts">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">My Workouts</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{workouts.length} total workout{workouts.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setAddOpen(true)} size="md">
          <Plus className="w-4 h-4" />
          Add Workout
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="relative sm:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search workouts…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <Select
          options={TYPE_OPTIONS}
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
        />
        <Select
          options={SORT_OPTIONS}
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title={search || typeFilter ? 'No workouts match your search' : 'No workouts yet'}
          description={search || typeFilter
            ? 'Try adjusting your search or filters.'
            : 'Add your first workout to start tracking your progress.'}
          actionLabel={!search && !typeFilter ? 'Add Workout' : undefined}
          onAction={!search && !typeFilter ? () => setAddOpen(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(w => <WorkoutCard key={w.id} workout={w} />)}
        </div>
      )}

      {/* Add modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Workout" size="lg">
        <WorkoutForm
          onSubmit={handleAdd}
          onCancel={() => setAddOpen(false)}
        />
      </Modal>
    </AppLayout>
  )
}
