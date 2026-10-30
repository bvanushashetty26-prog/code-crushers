import React, { useState } from 'react'
import { useRouter } from 'next/router'
import AppLayout from '@/components/layout/AppLayout'
import WorkoutForm from '@/components/workouts/WorkoutForm'
import Card from '@/components/ui/Card'
import { useApp } from '@/context/AppContext'
import { Workout } from '@/lib/types'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewWorkoutPage() {
  const { addWorkout } = useApp()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  function handleSubmit(data: Omit<Workout, 'id' | 'createdAt'>) {
    setLoading(true)
    addWorkout(data)
    setTimeout(() => {
      router.push('/workouts')
    }, 300)
  }

  return (
    <AppLayout title="Add Workout">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/workouts" className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add Workout</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Log a new workout session</p>
          </div>
        </div>
        <Card>
          <WorkoutForm
            onSubmit={handleSubmit}
            onCancel={() => router.push('/workouts')}
            loading={loading}
          />
        </Card>
      </div>
    </AppLayout>
  )
}
