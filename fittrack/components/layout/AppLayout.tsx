import React, { useState } from 'react'
import Sidebar from './Sidebar'
import TopNav from './TopNav'
import MobileBottomNav from './MobileBottomNav'

interface AppLayoutProps {
  title?: string
  children: React.ReactNode
}

export default function AppLayout({ title = 'FitTrack', children }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopNav title={title} onMenuClick={() => setMobileMenuOpen(true)} />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileBottomNav />
    </div>
  )
}
