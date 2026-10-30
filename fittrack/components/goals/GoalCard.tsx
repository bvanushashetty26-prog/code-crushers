import React, { useState } from 'react'
import { Goal } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import Card from '@/components/ui/Card'
import ProgressBar from '@/components/ui/ProgressBar'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import GoalForm from './GoalForm'
import { CheckCircle, Edit2, Trash2, Calendar, Trophy, TrendingUp } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import Input from '@/components/ui/Input'

interface GoalCardProps {
  goal: Goal
}

const UNIT_LABELS: Record<string, string> = {
  workouts: 'workouts',
  minutes: 'min',
  calories: 'cal',
  km: 'km',
}

const PERIOD_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  total: 'Total',
}

const PROGRESS_COLORS = ['blue', 'green', 'amber', 'purple'] as const

export default function GoalCard({ goal: g }: GoalCardProps) {
  const { updateGoal, deleteGoal, completeGoal } = useApp()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [progressEdit, setProgressEdit] = useState(false)
  const [newProgress, setNewProgress] = useState(g.currentValue.toString())

  const pct = g.targetValue === 0 ? 0 : Math.min(100, Math.round((g.currentValue / g.targetValue) * 100))
  const colorIdx = Math.abs(g.id.charCodeAt(0)) % PROGRESS_COLORS.length
  const color = PROGRESS_COLORS[colorIdx]

  function handleEdit(data: Omit<Goal, 'id' | 'createdAt' | 'completed' | 'completedAt'>) {
    updateGoal(g.id, data)
    setEditOpen(false)
  }

  function handleSaveProgress() {
    const v = Number(newProgress)
    if (!isNaN(v) && v >= 0) {
      updateGoal(g.id, { currentValue: v, completed: v >= g.targetValue })
    }
    setProgressEdit(false)
  }

  return (
    <>
      <Card className={`border-l-4 ${g.completed ? 'border-l-emerald-500' : `border-l-brand-500`}`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {g.completed
              ? <Trophy className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              : <TrendingUp className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{g.title}</p>
              {g.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{g.description}</p>
              )}
            </div>
          </div>
          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {!g.completed && (
              <>
                <button onClick={() => setEditOpen(true)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" aria-label="Edit goal">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => setProgressEdit(v => !v)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" aria-label="Update progress" title="Update progress">
                  <TrendingUp className="w-4 h-4" />
                </button>
              </>
            )}
            <button onClick={() => setDeleteOpen(true)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" aria-label="Delete goal">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-3 flex-wrap text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {g.currentValue} / {g.targetValue} {UNIT_LABELS[g.unit] ?? g.unit}
          </span>
          <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{PERIOD_LABELS[g.period]}</span>
          {g.deadline && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Due {formatDate(g.deadline)}
            </span>
          )}
          {g.completed && g.completedAt && (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle className="w-3 h-3" /> Completed {formatDate(g.completedAt)}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <ProgressBar value={pct} color={color} size="md" showLabel />

        {/* Inline progress update */}
        {progressEdit && !g.completed && (
          <div className="mt-3 flex items-end gap-2">
            <div className="flex-1">
              <Input
                label="Update progress"
                type="number"
                min="0"
                max={g.targetValue}
                value={newProgress}
                onChange={e => setNewProgress(e.target.value)}
              />
            </div>
            <Button size="sm" onClick={handleSaveProgress}>Save</Button>
            {!g.completed && pct < 100 && (
              <Button size="sm" variant="secondary" onClick={() => { completeGoal(g.id); setProgressEdit(false) }}>
                <CheckCircle className="w-3.5 h-3.5" /> Complete
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Edit modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Goal" size="lg">
        <GoalForm initial={g} onSubmit={handleEdit} onCancel={() => setEditOpen(false)} />
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Goal"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => { deleteGoal(g.id); setDeleteOpen(false) }}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{g.title}</strong>? This cannot be undone.
        </p>
      </Modal>
    </>
  )
}
