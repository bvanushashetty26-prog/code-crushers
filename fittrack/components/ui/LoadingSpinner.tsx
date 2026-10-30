import React from 'react'

export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' }[size]
  return (
    <div className="flex items-center justify-center py-12">
      <svg className={`animate-spin ${s} text-brand-600`} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
        <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8v8z" />
      </svg>
    </div>
  )
}
