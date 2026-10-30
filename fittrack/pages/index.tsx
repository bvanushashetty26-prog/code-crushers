import React from 'react'
import AppLayout from '@/components/layout/AppLayout'
import StatCard from '@/components/dashboard/StatCard'
import RecentWorkouts from '@/components/dashboard/RecentWorkouts'
import GoalProgressCard from '@/components/dashboard/GoalProgressCard'
import WeeklyActivity from '@/components/dashboard/WeeklyActivity'
import QuickActions from '@/components/dashboard/QuickActions'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useApp } from '@/context/AppContext'
import {
  getThisWeekWorkouts,
  getTotalDuration,
  getTotalCalories,
  formatDuration,
  getWeeklyChartData,
} from '@/lib/utils'
import { Dumbbell, Clock, Flame, Target, CalendarDays, CheckCircle } from 'lucide-react'

export default function DashboardPage() {
  const { workouts, goals, profile, loading } = useApp()

  if (loading) return <AppLayout title="Dashboard"><LoadingSpinner /></AppLayout>

  const weekWorkouts = getThisWeekWorkouts(workouts)
  const weekDuration = getTotalDuration(weekWorkouts)
  const weekCalories = getTotalCalories(weekWorkouts)
  const completedWorkouts = workouts.filter(w => w.completed).length
  const activeGoals = goals.filter(g => !g.completed).length
  const completedGoals = goals.filter(g => g.completed).length
  const recentWorkouts = [...workouts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)
  const weeklyData = getWeeklyChartData(workouts)

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <AppLayout title="Dashboard">
      {/* Welcome */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          {greeting}, {profile.name.split(' ')[0] || 'Athlete'}! 👋
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-0.5">{dateStr} · Let's crush your goals today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Workouts This Week"
          value={weekWorkouts.length}
          subtitle={`${completedWorkouts} total completed`}
          icon={Dumbbell}
          iconColor="text-brand-600"
          iconBg="bg-brand-50 dark:bg-brand-900/20"
        />
        <StatCard
          title="Time Exercised"
          value={formatDuration(weekDuration)}
          subtitle="this week"
          icon={Clock}
          iconColor="text-violet-600"
          iconBg="bg-violet-50 dark:bg-violet-900/20"
        />
        <StatCard
          title="Calories Burned"
          value={weekCalories.toLocaleString()}
          subtitle="this week"
          icon={Flame}
          iconColor="text-orange-500"
          iconBg="bg-orange-50 dark:bg-orange-900/20"
        />
        <StatCard
          title="Active Goals"
          value={activeGoals}
          subtitle={`${completedGoals} completed`}
          icon={Target}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50 dark:bg-emerald-900/20"
        />
      </div>

      {/* Quick actions */}
      <div className="mb-6">
        <QuickActions />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent workouts – takes 2 cols */}
        <div className="xl:col-span-2 space-y-6">
          <RecentWorkouts workouts={recentWorkouts} />
        </div>

        {/* Sidebar widgets */}
        <div className="space-y-6">
          <WeeklyActivity data={weeklyData} />
          <GoalProgressCard goals={goals} />
        </div>
      </div>
    </AppLayout>
  )
}
