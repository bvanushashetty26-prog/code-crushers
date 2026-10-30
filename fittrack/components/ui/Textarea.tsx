import React, { TextareaHTMLAttributes, forwardRef } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', id, ...rest }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          {...rest}
          className={[
            'w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 transition-colors resize-none',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
            error
              ? 'border-red-400 dark:border-red-500'
              : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500',
            className,
          ].join(' ')}
        />
        {hint && !error && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
export default Textarea
