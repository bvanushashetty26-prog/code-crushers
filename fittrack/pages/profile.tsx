import React, { useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import { useApp } from '@/context/AppContext'
import { WorkoutType } from '@/lib/types'
import { clearState } from '@/lib/storage'
import { User, Settings, Sun, Moon, Trash2, CheckCircle, Dumbbell } from 'lucide-react'
import Modal from '@/components/ui/Modal'

const WORKOUT_TYPE_OPTIONS = [
  { value: '',          label: 'No preference' },
  { value: 'Strength',  label: '💪 Strength' },
  { value: 'Cardio',    label: '🏃 Cardio' },
  { value: 'Running',   label: '👟 Running' },
  { value: 'Cycling',   label: '🚴 Cycling' },
  { value: 'Yoga',      label: '🧘 Yoga' },
  { value: 'Other',     label: '⚡ Other' },
]

export default function ProfilePage() {
  const { profile, updateProfile, darkMode, toggleDarkMode, workouts, goals } = useApp()
  const [form, setForm] = useState({ ...profile })
  const [saved, setSaved] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  function set(key: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [key]: value }))
    setSaved(false)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    // Auto-generate initials
    const initials = form.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(s => s[0].toUpperCase())
      .join('')
    updateProfile({ ...form, avatarInitials: initials || 'U' })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function handleReset() {
    clearState()
    window.location.reload()
  }

  const totalWorkouts = workouts.length
  const completedWorkouts = workouts.filter(w => w.completed).length
  const totalCalories = workouts.reduce((s, w) => s + w.caloriesBurned, 0)
  const completedGoals = goals.filter(g => g.completed).length

  return (
    <AppLayout title="Profile & Settings">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile header */}
        <Card className="flex items-center gap-5">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 text-white text-xl font-bold shadow-md shrink-0">
            {profile.avatarInitials || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{profile.name || 'Athlete'}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{profile.email || 'No email set'}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{profile.fitnessGoal || 'No goal set'}</p>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Workouts', value: totalWorkouts, icon: Dumbbell, color: 'text-brand-600' },
            { label: 'Completed', value: completedWorkouts, icon: CheckCircle, color: 'text-emerald-600' },
            { label: 'Calories', value: totalCalories.toLocaleString(), icon: null, color: 'text-orange-500' },
            { label: 'Goals Done', value: completedGoals, icon: null, color: 'text-amber-500' },
          ].map(({ label, value, color }) => (
            <Card key={label} className="text-center py-3">
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
            </Card>
          ))}
        </div>

        {/* Profile form */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <User className="w-5 h-5 text-brand-600" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Personal Information</h3>
          </div>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Alex Johnson"
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="alex@email.com"
              />
            </div>
            <Textarea
              label="Fitness Goal"
              rows={2}
              value={form.fitnessGoal}
              onChange={e => set('fitnessGoal', e.target.value)}
              placeholder="e.g. Build strength and improve cardiovascular fitness"
            />
            <Select
              label="Preferred Workout Type"
              options={WORKOUT_TYPE_OPTIONS}
              value={form.preferredWorkoutType}
              onChange={e => set('preferredWorkoutType', e.target.value)}
            />
            <div className="flex justify-end gap-3 pt-1">
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-4 h-4" /> Saved!
                </span>
              )}
              <Button type="submit">Save Profile</Button>
            </div>
          </form>
        </Card>

        {/* Appearance */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-brand-600" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Appearance</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Dark Mode</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Switch between light and dark themes</p>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative w-14 h-7 rounded-full transition-colors ${darkMode ? 'bg-brand-600' : 'bg-slate-300'}`}
              aria-label="Toggle dark mode"
            >
              <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow flex items-center justify-center transition-transform ${darkMode ? 'translate-x-7' : ''}`}>
                {darkMode ? <Moon className="w-3 h-3 text-slate-600" /> : <Sun className="w-3 h-3 text-amber-500" />}
              </div>
            </button>
          </div>
        </Card>

        {/* Danger zone */}
        <Card className="border-red-200 dark:border-red-800/50">
          <div className="flex items-center gap-2 mb-3">
            <Trash2 className="w-5 h-5 text-red-500" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Danger Zone</h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Reset all FitTrack data including workouts, goals, and profile. This cannot be undone.
          </p>
          <Button variant="danger" size="sm" onClick={() => setResetOpen(true)}>
            Reset All Data
          </Button>
        </Card>
      </div>

      {/* Reset confirm */}
      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset All Data"
        footer={
          <>
            <Button variant="outline" onClick={() => setResetOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleReset}>Yes, Reset Everything</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          This will permanently delete all your workouts, goals, and profile data and restore the sample data. Are you sure?
        </p>
      </Modal>
    </AppLayout>
  )
}
