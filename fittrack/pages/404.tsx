import React from 'react'
import Link from 'next/link'
import AppLayout from '@/components/layout/AppLayout'
import Button from '@/components/ui/Button'
import { Home } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <AppLayout title="Page Not Found">
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-8xl font-black text-brand-600/20 dark:text-brand-400/20 mb-4">404</p>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Page not found</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href="/">
          <Button>
            <Home className="w-4 h-4" /> Go to Dashboard
          </Button>
        </Link>
      </div>
    </AppLayout>
  )
}
