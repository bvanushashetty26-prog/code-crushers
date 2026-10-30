import React, { SelectHTMLAttributes, forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', id, ...rest }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
            {rest.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            {...rest}
            className={[
              'w-full appearance-none rounded-lg border px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white pr-9 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
              error
                ? 'border-red-400 dark:border-red-500'
                : 'border-slate-300 dark:border-slate-600',
              className,
            ].join(' ')}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
export default Select
