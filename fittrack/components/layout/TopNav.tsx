import React from 'react'
import { Sun, Moon, Menu, Bell } from 'lucide-react'
import { useApp } from '@/context/AppContext'

interface TopNavProps {
  title: string
  onMenuClick: () => void
}

export default function TopNav({ title, onMenuClick }: TopNavProps) {
  const { darkMode, toggleDarkMode, profile } = useApp()

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 px-4 lg:px-6 py-3 flex items-center gap-4">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white truncate">{title}</h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Avatar */}
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-600 text-white text-xs font-bold">
          {profile.avatarInitials || 'U'}
        </div>
      </div>
    </header>
  )
}
