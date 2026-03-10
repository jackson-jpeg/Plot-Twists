'use client'

import { forwardRef } from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  success?: boolean
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, success, hint, id, className = '', style, ...props },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          className="
            w-full h-12 px-4
            text-base font-[var(--font-body)]
            bg-[var(--color-surface-inset)]
            text-[var(--color-text-primary)]
            rounded-xl outline-none
            transition-[border-color,box-shadow] duration-150
            focus:border-[var(--color-accent)] focus:ring-[3px] focus:ring-[var(--color-accent-light)]
          "
          style={{
            border: error
              ? '2px solid var(--color-danger)'
              : success
              ? '2px solid var(--color-success)'
              : '1.5px solid var(--color-border)',
            paddingRight: success ? '44px' : undefined,
            ...style,
          }}
          {...props}
        />
        {success && !error && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-success)] text-xl font-bold">
            ✓
          </span>
        )}
      </div>
      {error && (
        <p className="text-[13px] text-[var(--color-danger)] mt-1">{error}</p>
      )}
      {hint && !error && (
        <p className="text-[13px] text-[var(--color-text-tertiary)] mt-1">{hint}</p>
      )}
    </div>
  )
})
