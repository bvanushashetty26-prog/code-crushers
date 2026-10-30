// Utilities for dates, IDs, and aggregation

import { Workout } from './types'

// ─── ID generation ───────────────────────────────────────────────────────────

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// ─── Date helpers ────────────────────────────────────────────────────────────

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function formatDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateShort(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date)
  const day = d.getDay()           // 0 = Sunday
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

export function isThisWeek(isoDate: string): boolean {
  const workoutDate = new Date(isoDate + 'T00:00:00')
  const weekStart = getWeekStart()
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)
  return workoutDate >= weekStart && workoutDate < weekEnd
}

export function isThisMonth(isoDate: string): boolean {
  const d = new Date(isoDate + 'T00:00:00')
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

export function isToday(isoDate: string): boolean {
  return isoDate === todayISO()
}

// ─── Workout aggregation ─────────────────────────────────────────────────────

export function getThisWeekWorkouts(workouts: Workout[]): Workout[] {
  return workouts.filter(w => isThisWeek(w.date))
}

export function getTodayWorkouts(workouts: Workout[]): Workout[] {
  return workouts.filter(w => isToday(w.date))
}

export function getTotalDuration(workouts: Workout[]): number {
  return workouts.reduce((sum, w) => sum + w.duration, 0)
}

export function getTotalCalories(workouts: Workout[]): number {
  return workouts.reduce((sum, w) => sum + w.caloriesBurned, 0)
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

// ─── Weekly chart data ────────────────────────────────────────────────────────

export interface WeekDayData {
  day: string
  workouts: number
  duration: number
  calories: number
}

export function getWeeklyChartData(workouts: Workout[]): WeekDayData[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const weekStart = getWeekStart()
  return days.map((day, i) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    const iso = date.toISOString().slice(0, 10)
    const dayWorkouts = workouts.filter(w => w.date === iso)
    return {
      day,
      workouts: dayWorkouts.length,
      duration: getTotalDuration(dayWorkouts),
      calories: getTotalCalories(dayWorkouts),
    }
  })
}

// ─── Monthly chart data ───────────────────────────────────────────────────────

export interface MonthWeekData {
  week: string
  workouts: number
  duration: number
  calories: number
}

export function getMonthlyChartData(workouts: Workout[]): MonthWeekData[] {
  const now = new Date()
  const result: MonthWeekData[] = []
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - (i * 7 + now.getDay()))
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)
    const ww = workouts.filter(w => {
      const d = new Date(w.date + 'T00:00:00')
      return d >= weekStart && d < weekEnd
    })
    result.push({
      week: `Wk ${4 - i}`,
      workouts: ww.length,
      duration: getTotalDuration(ww),
      calories: getTotalCalories(ww),
    })
  }
  return result
}

// ─── Workout type distribution ────────────────────────────────────────────────

export interface TypeCount { name: string; value: number; color: string }

const TYPE_COLORS: Record<string, string> = {
  Strength: '#3b82f6',
  Cardio:   '#10b981',
  Running:  '#f59e0b',
  Cycling:  '#8b5cf6',
  Yoga:     '#ec4899',
  Other:    '#6b7280',
}

export function getWorkoutTypeDistribution(workouts: Workout[]): TypeCount[] {
  const counts: Record<string, number> = {}
  workouts.forEach(w => { counts[w.type] = (counts[w.type] ?? 0) + 1 })
  return Object.entries(counts).map(([name, value]) => ({
    name,
    value,
    color: TYPE_COLORS[name] ?? '#6b7280',
  }))
}

export const WORKOUT_TYPE_COLORS = TYPE_COLORS
