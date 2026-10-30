import React, { useState } from 'react'
import { Goal, GoalUnit, GoalPeriod } from '@/lib/types'
import { todayISO } from '@/lib/utils'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'

const UNIT_OPTIONS: { value: GoalUnit; label: string }[] = [
  { value: 'workouts', label: '🏋️ Workouts' },
  { value: 'minutes',  label: '⏱️ Minutes' },
  { value: 'calories', label: '🔥 Calories' },
  { value: 'km',       label: '📏 Kilometres' },
]

const PERIOD_OPTIONS: { value: GoalPeriod; label: string }[] = [
  { value: 'weekly',  label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'total',   label: 'Total / One-time' },
]

type FormFields = {
  title: string
  description: string
  targetValue: string
  currentValue: string
  unit: GoalUnit | ''
  period: GoalPeriod | ''
  deadline: string
}

type Errors = Partial<Record<keyof FormFields, string>>

interface GoalFormProps {
  initial?: Partial<Goal>
  onSubmit: (data: Omit<Goal, 'id' | 'createdAt' | 'completed' | 'completedAt'>) => void
  onCancel: () => void
  loading?: boolean
}

function validate(fields: FormFields): Errors {
  const errs: Errors = {}
  if (!fields.title.trim()) errs.title = 'Goal title is required'
  if (!fields.unit) errs.unit = 'Please select a unit'
  if (!fields.period) errs.period = 'Please select a period'
  const tv = Number(fields.targetValue)
  if (!fields.targetValue || isNaN(tv) || tv <= 0) errs.targetValue = 'Target must be a positive number'
  const cv = Number(fields.currentValue)
  if (fields.currentValue !== '' && (isNaN(cv) || cv < 0)) errs.currentValue = 'Current value must be 0 or more'
  return errs
}

export default function GoalForm({ initial, onSubmit, onCancel, loading }: GoalFormProps) {
  const [fields, setFields] = useState<FormFields>({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    targetValue: initial?.targetValue?.toString() ?? '',
    currentValue: initial?.currentValue?.toString() ?? '0',
    unit: initial?.unit ?? '',
    period: initial?.period ?? '',
    deadline: initial?.deadline ?? '',
  })
  const [errors, setErrors] = useState<Errors>({})

  function set(key: keyof FormFields, value: string) {
    setFields(f => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate(fields)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    onSubmit({
      title: fields.title.trim(),
      description: fields.description.trim(),
      targetValue: Number(fields.targetValue),
      currentValue: Number(fields.currentValue) || 0,
      unit: fields.unit as GoalUnit,
      period: fields.period as GoalPeriod,
      deadline: fields.deadline || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Input
        label="Goal Title"
        placeholder="e.g. 5 Workouts per Week"
        value={fields.title}
        onChange={e => set('title', e.target.value)}
        error={errors.title}
        required
      />
      <Textarea
        label="Description (optional)"
        placeholder="Describe your goal…"
        rows={2}
        value={fields.description}
        onChange={e => set('description', e.target.value)}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Unit"
          options={UNIT_OPTIONS}
          placeholder="Select unit…"
          value={fields.unit}
          onChange={e => set('unit', e.target.value)}
          error={errors.unit}
          required
        />
        <Select
          label="Period"
          options={PERIOD_OPTIONS}
          placeholder="Select period…"
          value={fields.period}
          onChange={e => set('period', e.target.value)}
          error={errors.period}
          required
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Target Value"
          type="number"
          min="1"
          placeholder="e.g. 5"
          value={fields.targetValue}
          onChange={e => set('targetValue', e.target.value)}
          error={errors.targetValue}
          required
        />
        <Input
          label="Current Progress"
          type="number"
          min="0"
          placeholder="0"
          value={fields.currentValue}
          onChange={e => set('currentValue', e.target.value)}
          error={errors.currentValue}
        />
      </div>
      <Input
        label="Deadline (optional)"
        type="date"
        value={fields.deadline}
        onChange={e => set('deadline', e.target.value)}
        hint="Leave blank for open-ended goals"
      />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>
          {initial?.id ? 'Save Changes' : 'Create Goal'}
        </Button>
      </div>
    </form>
  )
}
