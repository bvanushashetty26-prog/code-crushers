// ─── Workout ────────────────────────────────────────────────────────────────

export type WorkoutType =
  | 'Strength'
  | 'Cardio'
  | 'Running'
  | 'Cycling'
  | 'Yoga'
  | 'Other'

export interface Workout {
  id: string
  name: string
  type: WorkoutType
  duration: number        // minutes
  sets?: number
  reps?: number
  caloriesBurned: number
  date: string            // YYYY-MM-DD
  completed: boolean
  notes?: string
  createdAt: string       // ISO timestamp
}

// ─── Goal ───────────────────────────────────────────────────────────────────

export type GoalUnit = 'workouts' | 'km' | 'minutes' | 'calories'
export type GoalPeriod = 'weekly' | 'monthly' | 'total'

export interface Goal {
  id: string
  title: string
  description: string
  targetValue: number
  currentValue: number
  unit: GoalUnit
  period: GoalPeriod
  deadline?: string       // YYYY-MM-DD
  completed: boolean
  createdAt: string
  completedAt?: string
}

// ─── User / Profile ─────────────────────────────────────────────────────────

export interface UserProfile {
  name: string
  email: string
  fitnessGoal: string
  preferredWorkoutType: WorkoutType | ''
  avatarInitials: string
}

// ─── Chat ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

// ─── App State ───────────────────────────────────────────────────────────────

export interface AppState {
  workouts: Workout[]
  goals: Goal[]
  profile: UserProfile
}
