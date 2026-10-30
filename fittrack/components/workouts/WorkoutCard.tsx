import React, { useState } from 'react'
import { Workout } from '@/lib/types'
import { formatDate, formatDuration } from '@/lib/utils'
import Card from '@/components/ui/Card'
import Badge, { WORKOUT_TYPE_BADGE_COLOR } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import WorkoutForm from './WorkoutForm'
import { CheckCircle, Circle, Clock, Flame, Edit2, Trash2, ChevronDown, ChevronUp, Layers, RefreshCw } from 'lucide-react'
import { useApp } from '@/context/AppContext'

interface WorkoutCardProps {
  workout: Workout
}

export default function WorkoutCard({ workout: w }: WorkoutCardProps) {
  const { updateWorkout, deleteWorkout, toggleWorkoutComplete } = useApp()
  const [expanded, setExpanded] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  function handleEdit(data: Omit<Workout, 'id' | 'createdAt'>) {
    updateWorkout(w.id, data)
    setEditOpen(false)
  }

  function handleDelete() {
    deleteWorkout(w.id)
    setDeleteOpen(false)
  }

  return (
    <>
      <Card padding="none" className="overflow-hidden">
        {/* Main row */}
        <div className="flex items-start gap-3 p-4">
          {/* Complete toggle */}
          <button
            onClick={() => toggleWorkoutComplete(w.id)}
            className="mt-0.5 shrink-0 focus:outline-none"
            aria-label={w.completed ? 'Mark incomplete' : 'Mark complete'}
          >
            {w.completed
              ? <CheckCircle className="w-6 h-6 text-emerald-500" />
              : <Circle className="w-6 h-6 text-slate-400 hover:text-brand-500 transition-colors" />}
          </button>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${w.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                  {w.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatDate(w.date)}</p>
              </div>
              <Badge color={WORKOUT_TYPE_BADGE_COLOR[w.type]} size="sm">{w.type}</Badge>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {w.duration}m
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" /> {w.caloriesBurned} cal
              </span>
              {w.sets && (
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" /> {w.sets} sets {w.reps ? `× ${w.reps} reps` : ''}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setEditOpen(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Edit workout"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              aria-label="Delete workout"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            {w.notes && (
              <button
                onClick={() => setExpanded(v => !v)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Toggle notes"
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Notes expansion */}
        {expanded && w.notes && (
          <div className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/40 border-t border-slate-100 dark:border-slate-700">
            <p className="pt-3">{w.notes}</p>
          </div>
        )}
      </Card>

      {/* Edit modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Workout" size="lg">
        <WorkoutForm
          initial={w}
          onSubmit={handleEdit}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Workout"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{w.name}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </>
  )
}
