import React, { useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import GoalCard from '@/components/goals/GoalCard'
import GoalForm from '@/components/goals/GoalForm'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useApp } from '@/context/AppContext'
import { Goal } from '@/lib/types'
import { Plus, Target, Trophy } from 'lucide-react'
import Card from '@/components/ui/Card'

export default function GoalsPage() {
  const { goals, addGoal, loading } = useApp()
  const [addOpen, setAddOpen] = useState(false)
  const [tab, setTab] = useState<'active' | 'completed'>('active')

  function handleAdd(data: Omit<Goal, 'id' | 'createdAt' | 'completed' | 'completedAt'>) {
    addGoal(data)
    setAddOpen(false)
  }

  const activeGoals = goals.filter(g => !g.completed)
  const completedGoals = goals.filter(g => g.completed)
  const shown = tab === 'active' ? activeGoals : completedGoals

  if (loading) return <AppLayout title="Goals"><LoadingSpinner /></AppLayout>

  return (
    <AppLayout title="Goals">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Fitness Goals</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{activeGoals.length} active · {completedGoals.length} completed</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4" /> Create Goal
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card className="text-center py-4">
          <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{goals.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Total Goals</p>
        </Card>
        <Card className="text-center py-4">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activeGoals.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Active</p>
        </Card>
        <Card className="text-center py-4">
          <p className="text-2xl font-bold text-amber-500">{completedGoals.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Completed</p>
        </Card>
        <Card className="text-center py-4">
          <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
            {goals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0}%
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Success Rate</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('active')}
          className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${tab === 'active' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
        >
          Active ({activeGoals.length})
        </button>
        <button
          onClick={() => setTab('completed')}
          className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${tab === 'completed' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
        >
          Completed ({completedGoals.length})
        </button>
      </div>

      {/* Goal list */}
      {shown.length === 0 ? (
        <EmptyState
          icon={tab === 'active' ? Target : Trophy}
          title={tab === 'active' ? 'No active goals' : 'No completed goals yet'}
          description={tab === 'active'
            ? "You haven't created a fitness goal yet. Set a target to stay motivated!"
            : 'Complete your active goals to see them here.'}
          actionLabel={tab === 'active' ? 'Create Goal' : undefined}
          onAction={tab === 'active' ? () => setAddOpen(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shown.map(g => <GoalCard key={g.id} goal={g} />)}
        </div>
      )}

      {/* Add modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Create Goal" size="lg">
        <GoalForm onSubmit={handleAdd} onCancel={() => setAddOpen(false)} />
      </Modal>
    </AppLayout>
  )
}
