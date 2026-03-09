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

  const borderStyle = error
    ? '2px solid var(--color-danger)'
    : success
    ? '2px solid var(--color-success)'
    : '1px solid var(--color-border)'

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-text-tertiary)',
            marginBottom: '6px',
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <input
          ref={ref}
          id={inputId}
          style={{
            width: '100%',
            fontSize: '17px',
            fontFamily: 'var(--font-ui)',
            padding: '14px 16px',
            paddingRight: success ? '44px' : '16px',
            borderRadius: 'var(--radius-lg)',
            border: borderStyle,
            background: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            outline: 'none',
            transition: 'border-color 0.2s',
            ...style,
          }}
          {...props}
        />
        {success && !error && (
          <span
            style={{
              position: 'absolute',
              right: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-success)',
              fontSize: '20px',
              fontWeight: 700,
            }}
          >
            {'\u2713'}
          </span>
        )}
      </div>
      {error && (
        <p style={{ fontSize: '13px', color: 'var(--color-danger)', marginTop: '4px' }}>{error}</p>
      )}
      {hint && !error && (
        <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>{hint}</p>
      )}
    </div>
  )
})
