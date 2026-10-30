import { AppState, Workout, Goal, UserProfile } from './types'
import { generateId, todayISO } from './utils'

const STORAGE_KEY = 'fittrack_data'

// ─── Seed data ───────────────────────────────────────────────────────────────

function buildSeedData(): AppState {
  const today = todayISO()
  const d = (daysAgo: number) => {
    const dt = new Date()
    dt.setDate(dt.getDate() - daysAgo)
    return dt.toISOString().slice(0, 10)
  }

  const workouts: Workout[] = [
    {
      id: generateId(),
      name: 'Morning Run',
      type: 'Running',
      duration: 35,
      caloriesBurned: 320,
      date: today,
      completed: false,
      notes: 'Easy pace, felt good',
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      name: 'Upper Body Strength',
      type: 'Strength',
      duration: 50,
      sets: 4,
      reps: 12,
      caloriesBurned: 280,
      date: d(1),
      completed: true,
      notes: 'Bench press, rows, shoulder press',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: generateId(),
      name: 'Evening Cycling',
      type: 'Cycling',
      duration: 45,
      caloriesBurned: 390,
      date: d(2),
      completed: true,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: generateId(),
      name: 'Yoga & Stretch',
      type: 'Yoga',
      duration: 30,
      caloriesBurned: 120,
      date: d(3),
      completed: true,
      notes: 'Focus on hip flexors',
      createdAt: new Date(Date.now() - 259200000).toISOString(),
    },
    {
      id: generateId(),
      name: 'HIIT Cardio',
      type: 'Cardio',
      duration: 25,
      caloriesBurned: 310,
      date: d(4),
      completed: true,
      createdAt: new Date(Date.now() - 345600000).toISOString(),
    },
    {
      id: generateId(),
      name: 'Leg Day',
      type: 'Strength',
      duration: 60,
      sets: 4,
      reps: 10,
      caloriesBurned: 360,
      date: d(5),
      completed: true,
      notes: 'Squats, deadlifts, lunges',
      createdAt: new Date(Date.now() - 432000000).toISOString(),
    },
    {
      id: generateId(),
      name: 'Park Run',
      type: 'Running',
      duration: 40,
      caloriesBurned: 370,
      date: d(6),
      completed: true,
      createdAt: new Date(Date.now() - 518400000).toISOString(),
    },
    {
      id: generateId(),
      name: 'Core Circuit',
      type: 'Cardio',
      duration: 20,
      sets: 3,
      reps: 15,
      caloriesBurned: 180,
      date: d(8),
      completed: true,
      createdAt: new Date(Date.now() - 691200000).toISOString(),
    },
    {
      id: generateId(),
      name: 'Long Ride',
      type: 'Cycling',
      duration: 75,
      caloriesBurned: 620,
      date: d(10),
      completed: true,
      createdAt: new Date(Date.now() - 864000000).toISOString(),
    },
    {
      id: generateId(),
      name: 'Full Body Workout',
      type: 'Strength',
      duration: 55,
      sets: 3,
      reps: 12,
      caloriesBurned: 300,
      date: d(12),
      completed: true,
      createdAt: new Date(Date.now() - 1036800000).toISOString(),
    },
  ]

  const goals: Goal[] = [
    {
      id: generateId(),
      title: '5 Workouts per Week',
      description: 'Complete at least 5 workouts every week to build consistency.',
      targetValue: 5,
      currentValue: 4,
      unit: 'workouts',
      period: 'weekly',
      deadline: d(-7), // one week from now
      completed: false,
      createdAt: new Date(Date.now() - 604800000).toISOString(),
    },
    {
      id: generateId(),
      title: 'Exercise 150 Minutes/Week',
      description: 'Reach the recommended 150 minutes of exercise per week.',
      targetValue: 150,
      currentValue: 110,
      unit: 'minutes',
      period: 'weekly',
      deadline: d(-7),
      completed: false,
      createdAt: new Date(Date.now() - 604800000).toISOString(),
    },
    {
      id: generateId(),
      title: 'Burn 2000 Calories',
      description: 'Burn 2000 calories this month through workouts.',
      targetValue: 2000,
      currentValue: 2000,
      unit: 'calories',
      period: 'monthly',
      completed: true,
      completedAt: d(2),
      createdAt: new Date(Date.now() - 2592000000).toISOString(),
    },
  ]

  const profile: UserProfile = {
    name: 'Alex Johnson',
    email: 'alex.johnson@email.com',
    fitnessGoal: 'Build strength and improve cardiovascular fitness',
    preferredWorkoutType: 'Strength',
    avatarInitials: 'AJ',
  }

  return { workouts, goals, profile }
}

// ─── Read / Write ─────────────────────────────────────────────────────────────

export function loadState(): AppState {
  if (typeof window === 'undefined') return buildSeedData()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const seed = buildSeedData()
      saveState(seed)
      return seed
    }
    return JSON.parse(raw) as AppState
  } catch {
    return buildSeedData()
  }
}

export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // storage unavailable — in-memory only
  }
}

export function clearState(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
