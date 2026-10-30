import React from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Card from '@/components/ui/Card'
import StatCard from '@/components/dashboard/StatCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useApp } from '@/context/AppContext'
import {
  getThisWeekWorkouts,
  getTotalDuration,
  getTotalCalories,
  formatDuration,
  getMonthlyChartData,
  getWorkoutTypeDistribution,
  isThisMonth,
} from '@/lib/utils'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { Dumbbell, Clock, Flame, Trophy, TrendingUp } from 'lucide-react'

export default function ProgressPage() {
  const { workouts, goals, loading } = useApp()

  if (loading) return <AppLayout title="Progress"><LoadingSpinner /></AppLayout>

  const weekWorkouts = getThisWeekWorkouts(workouts)
  const monthWorkouts = workouts.filter(w => isThisMonth(w.date))
  const completedWorkouts = workouts.filter(w => w.completed)
  const completedGoals = goals.filter(g => g.completed)

  const monthlyData = getMonthlyChartData(workouts)
  const typeData = getWorkoutTypeDistribution(workouts)

  return (
    <AppLayout title="Progress">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Progress Analytics</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Track your fitness journey over time</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="This Week"
          value={weekWorkouts.length}
          subtitle="workouts"
          icon={Dumbbell}
          iconColor="text-brand-600"
          iconBg="bg-brand-50 dark:bg-brand-900/20"
        />
        <StatCard
          title="This Month"
          value={monthWorkouts.length}
          subtitle="workouts"
          icon={TrendingUp}
          iconColor="text-violet-600"
          iconBg="bg-violet-50 dark:bg-violet-900/20"
        />
        <StatCard
          title="Total Time"
          value={formatDuration(getTotalDuration(workouts))}
          subtitle="all time"
          icon={Clock}
          iconColor="text-orange-500"
          iconBg="bg-orange-50 dark:bg-orange-900/20"
        />
        <StatCard
          title="Goals Completed"
          value={completedGoals.length}
          subtitle={`${goals.length} total`}
          icon={Trophy}
          iconColor="text-amber-500"
          iconBg="bg-amber-50 dark:bg-amber-900/20"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Weekly workout count */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Workouts Per Week</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Last 4 weeks</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
                cursor={{ fill: 'rgba(59,130,246,0.05)' }}
              />
              <Bar dataKey="workouts" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Workouts" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Calories per week */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Calories Burned</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Last 4 weeks</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyData} margin={{ top: 0, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
              />
              <Line type="monotone" dataKey="calories" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} name="Calories" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Duration chart + type distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Duration per week */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Total Duration (min)</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Last 4 weeks</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
                cursor={{ fill: 'rgba(16,185,129,0.05)' }}
              />
              <Bar dataKey="duration" fill="#10b981" radius={[4, 4, 0, 0]} name="Minutes" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Workout type distribution */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Workout Type Distribution</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">All time</p>
          {typeData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-sm text-slate-400">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {typeData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </AppLayout>
  )
}
