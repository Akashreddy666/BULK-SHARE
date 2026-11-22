import React, { useId } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, 'aria-describedby': describedBy, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const message = error || helperText
    const messageId = message ? `${inputId}-message` : undefined

    return (
      <div className="w-full space-y-1.5">
        {label && <label htmlFor={inputId} className="block text-sm font-semibold text-ink">{label}</label>}
        <input
          {...props}
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : props['aria-invalid']}
          aria-describedby={[describedBy, messageId].filter(Boolean).join(' ') || undefined}
          className={cn('control w-full transition-colors', error && 'border-red-500 focus:border-red-600 focus:ring-red-200', className)}
        />
        {message && <p id={messageId} className={cn('text-sm', error ? 'text-red-700' : 'text-slate-600')}>{message}</p>}
      </div>
    )
  },
)

Input.displayName = 'Input'
