import React, { useState } from 'react'
import { Workout, WorkoutType } from '@/lib/types'
import { todayISO } from '@/lib/utils'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'

const WORKOUT_TYPES: { value: WorkoutType; label: string }[] = [
  { value: 'Strength', label: '💪 Strength' },
  { value: 'Cardio',   label: '🏃 Cardio' },
  { value: 'Running',  label: '👟 Running' },
  { value: 'Cycling',  label: '🚴 Cycling' },
  { value: 'Yoga',     label: '🧘 Yoga' },
  { value: 'Other',    label: '⚡ Other' },
]

type FormFields = {
  name: string
  type: WorkoutType | ''
  duration: string
  sets: string
  reps: string
  caloriesBurned: string
  date: string
  completed: boolean
  notes: string
}

type Errors = Partial<Record<keyof FormFields, string>>

interface WorkoutFormProps {
  initial?: Partial<Workout>
  onSubmit: (data: Omit<Workout, 'id' | 'createdAt'>) => void
  onCancel: () => void
  loading?: boolean
}

function validate(fields: FormFields): Errors {
  const errs: Errors = {}
  if (!fields.name.trim()) errs.name = 'Exercise name is required'
  if (!fields.type) errs.type = 'Please select a workout type'
  const dur = Number(fields.duration)
  if (!fields.duration || isNaN(dur) || dur <= 0) errs.duration = 'Duration must be a positive number'
  if (dur > 600) errs.duration = 'Duration seems too long (max 600 min)'
  const cal = Number(fields.caloriesBurned)
  if (!fields.caloriesBurned || isNaN(cal) || cal < 0) errs.caloriesBurned = 'Calories must be 0 or more'
  if (!fields.date) errs.date = 'Date is required'
  if (fields.sets && (isNaN(Number(fields.sets)) || Number(fields.sets) < 0)) errs.sets = 'Sets must be a positive number'
  if (fields.reps && (isNaN(Number(fields.reps)) || Number(fields.reps) < 0)) errs.reps = 'Reps must be a positive number'
  return errs
}

export default function WorkoutForm({ initial, onSubmit, onCancel, loading }: WorkoutFormProps) {
  const [fields, setFields] = useState<FormFields>({
    name: initial?.name ?? '',
    type: initial?.type ?? '',
    duration: initial?.duration?.toString() ?? '',
    sets: initial?.sets?.toString() ?? '',
    reps: initial?.reps?.toString() ?? '',
    caloriesBurned: initial?.caloriesBurned?.toString() ?? '',
    date: initial?.date ?? todayISO(),
    completed: initial?.completed ?? false,
    notes: initial?.notes ?? '',
  })
  const [errors, setErrors] = useState<Errors>({})
  const [touched, setTouched] = useState<Set<string>>(new Set())

  function set(key: keyof FormFields, value: string | boolean) {
    setFields(f => ({ ...f, [key]: value }))
    if (touched.has(key)) {
      const errs = validate({ ...fields, [key]: value })
      setErrors(e => ({ ...e, [key]: errs[key] }))
    }
  }

  function handleBlur(key: keyof FormFields) {
    setTouched(t => new Set(t).add(key))
    const errs = validate(fields)
    setErrors(e => ({ ...e, [key]: errs[key] }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate(fields)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      setTouched(new Set(Object.keys(fields)))
      return
    }
    onSubmit({
      name: fields.name.trim(),
      type: fields.type as WorkoutType,
      duration: Number(fields.duration),
      sets: fields.sets ? Number(fields.sets) : undefined,
      reps: fields.reps ? Number(fields.reps) : undefined,
      caloriesBurned: Number(fields.caloriesBurned),
      date: fields.date,
      completed: fields.completed,
      notes: fields.notes.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Row 1: name + type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Exercise Name"
          placeholder="e.g. Morning Run"
          value={fields.name}
          onChange={e => set('name', e.target.value)}
          onBlur={() => handleBlur('name')}
          error={errors.name}
          required
        />
        <Select
          label="Workout Type"
          options={WORKOUT_TYPES}
          placeholder="Select type…"
          value={fields.type}
          onChange={e => set('type', e.target.value)}
          onBlur={() => handleBlur('type')}
          error={errors.type}
          required
        />
      </div>

      {/* Row 2: duration + calories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Duration (minutes)"
          type="number"
          min="1"
          max="600"
          placeholder="30"
          value={fields.duration}
          onChange={e => set('duration', e.target.value)}
          onBlur={() => handleBlur('duration')}
          error={errors.duration}
          required
        />
        <Input
          label="Calories Burned"
          type="number"
          min="0"
          placeholder="250"
          value={fields.caloriesBurned}
          onChange={e => set('caloriesBurned', e.target.value)}
          onBlur={() => handleBlur('caloriesBurned')}
          error={errors.caloriesBurned}
          required
        />
      </div>

      {/* Row 3: sets + reps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Sets (optional)"
          type="number"
          min="0"
          placeholder="3"
          value={fields.sets}
          onChange={e => set('sets', e.target.value)}
          onBlur={() => handleBlur('sets')}
          error={errors.sets}
        />
        <Input
          label="Reps (optional)"
          type="number"
          min="0"
          placeholder="12"
          value={fields.reps}
          onChange={e => set('reps', e.target.value)}
          onBlur={() => handleBlur('reps')}
          error={errors.reps}
        />
      </div>

      {/* Row 4: date + completed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
        <Input
          label="Date"
          type="date"
          value={fields.date}
          onChange={e => set('date', e.target.value)}
          onBlur={() => handleBlur('date')}
          error={errors.date}
          required
        />
        <label className="flex items-center gap-2 cursor-pointer pb-2">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={fields.completed}
              onChange={e => set('completed', e.target.checked)}
            />
            <div className={`w-10 h-6 rounded-full transition-colors ${fields.completed ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600'}`} />
            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${fields.completed ? 'translate-x-4' : ''}`} />
          </div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Mark as completed</span>
        </label>
      </div>

      {/* Notes */}
      <Textarea
        label="Notes (optional)"
        placeholder="Any notes about this workout…"
        rows={3}
        value={fields.notes}
        onChange={e => set('notes', e.target.value)}
      />

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>
          {initial?.id ? 'Save Changes' : 'Add Workout'}
        </Button>
      </div>
    </form>
  )
}
