import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'
import { AppState, Workout, Goal, UserProfile } from '@/lib/types'
import { loadState, saveState } from '@/lib/storage'
import { generateId, todayISO } from '@/lib/utils'

// ─── Context shape ────────────────────────────────────────────────────────────

interface AppContextValue {
  // state
  workouts: Workout[]
  goals: Goal[]
  profile: UserProfile
  loading: boolean
  // workout actions
  addWorkout: (w: Omit<Workout, 'id' | 'createdAt'>) => void
  updateWorkout: (id: string, updates: Partial<Workout>) => void
  deleteWorkout: (id: string) => void
  toggleWorkoutComplete: (id: string) => void
  // goal actions
  addGoal: (g: Omit<Goal, 'id' | 'createdAt' | 'completed' | 'completedAt'>) => void
  updateGoal: (id: string, updates: Partial<Goal>) => void
  deleteGoal: (id: string) => void
  completeGoal: (id: string) => void
  // profile actions
  updateProfile: (updates: Partial<UserProfile>) => void
  // theme
  darkMode: boolean
  toggleDarkMode: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({ workouts: [], goals: [], profile: { name: '', email: '', fitnessGoal: '', preferredWorkoutType: '', avatarInitials: '' } })
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  // Hydrate from localStorage on mount
  useEffect(() => {
    const s = loadState()
    setState(s)
    setLoading(false)

    // Load dark mode preference
    const saved = localStorage.getItem('fittrack_darkmode')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = saved !== null ? saved === 'true' : prefersDark
    setDarkMode(isDark)
    if (isDark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [])

  const persist = useCallback((next: AppState) => {
    setState(next)
    saveState(next)
  }, [])

  // ── Workouts ──────────────────────────────────────────────────────────────

  const addWorkout = useCallback((w: Omit<Workout, 'id' | 'createdAt'>) => {
    const workout: Workout = {
      ...w,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    setState(prev => {
      const next = { ...prev, workouts: [workout, ...prev.workouts] }
      saveState(next)
      return next
    })
  }, [])

  const updateWorkout = useCallback((id: string, updates: Partial<Workout>) => {
    setState(prev => {
      const next = {
        ...prev,
        workouts: prev.workouts.map(w => w.id === id ? { ...w, ...updates } : w),
      }
      saveState(next)
      return next
    })
  }, [])

  const deleteWorkout = useCallback((id: string) => {
    setState(prev => {
      const next = { ...prev, workouts: prev.workouts.filter(w => w.id !== id) }
      saveState(next)
      return next
    })
  }, [])

  const toggleWorkoutComplete = useCallback((id: string) => {
    setState(prev => {
      const next = {
        ...prev,
        workouts: prev.workouts.map(w =>
          w.id === id ? { ...w, completed: !w.completed } : w
        ),
      }
      saveState(next)
      return next
    })
  }, [])

  // ── Goals ─────────────────────────────────────────────────────────────────

  const addGoal = useCallback((g: Omit<Goal, 'id' | 'createdAt' | 'completed' | 'completedAt'>) => {
    const goal: Goal = {
      ...g,
      id: generateId(),
      createdAt: new Date().toISOString(),
      completed: false,
    }
    setState(prev => {
      const next = { ...prev, goals: [goal, ...prev.goals] }
      saveState(next)
      return next
    })
  }, [])

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    setState(prev => {
      const next = {
        ...prev,
        goals: prev.goals.map(g => g.id === id ? { ...g, ...updates } : g),
      }
      saveState(next)
      return next
    })
  }, [])

  const deleteGoal = useCallback((id: string) => {
    setState(prev => {
      const next = { ...prev, goals: prev.goals.filter(g => g.id !== id) }
      saveState(next)
      return next
    })
  }, [])

  const completeGoal = useCallback((id: string) => {
    setState(prev => {
      const next = {
        ...prev,
        goals: prev.goals.map(g =>
          g.id === id
            ? { ...g, completed: true, completedAt: todayISO(), currentValue: g.targetValue }
            : g
        ),
      }
      saveState(next)
      return next
    })
  }, [])

  // ── Profile ───────────────────────────────────────────────────────────────

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setState(prev => {
      const next = { ...prev, profile: { ...prev.profile, ...updates } }
      saveState(next)
      return next
    })
  }, [])

  // ── Theme ─────────────────────────────────────────────────────────────────

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const next = !prev
      localStorage.setItem('fittrack_darkmode', String(next))
      if (next) document.documentElement.classList.add('dark')
      else document.documentElement.classList.remove('dark')
      return next
    })
  }, [])

  const value: AppContextValue = {
    workouts: state.workouts,
    goals: state.goals,
    profile: state.profile,
    loading,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    toggleWorkoutComplete,
    addGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
    updateProfile,
    darkMode,
    toggleDarkMode,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
