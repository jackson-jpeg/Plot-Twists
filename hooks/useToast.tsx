'use client'

import { useState, useCallback, createContext, useContext, ReactNode } from 'react'
import { ToastData } from '@/components/Toast'

interface ToastOptions {
  title?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  toasts: ToastData[]
  showToast: (message: string, type?: ToastData['type'], options?: ToastOptions) => string
  removeToast: (id: string) => void
  success: (message: string, options?: ToastOptions) => string
  error: (message: string, options?: ToastOptions) => string
  warning: (message: string, options?: ToastOptions) => string
  info: (message: string, options?: ToastOptions) => string
  clearAll: () => void
}

export function useToast(): ToastContextType {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const showToast = useCallback((
    message: string,
    type: ToastData['type'] = 'info',
    options?: ToastOptions
  ): string => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newToast: ToastData = {
      id,
      message,
      type,
      title: options?.title,
      duration: options?.duration,
      action: options?.action
    }
    setToasts(prev => [...prev, newToast])
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setToasts([])
  }, [])

  const success = useCallback((message: string, options?: ToastOptions) =>
    showToast(message, 'success', options), [showToast])

  const error = useCallback((message: string, options?: ToastOptions) =>
    showToast(message, 'error', options), [showToast])

  const warning = useCallback((message: string, options?: ToastOptions) =>
    showToast(message, 'warning', options), [showToast])

  const info = useCallback((message: string, options?: ToastOptions) =>
    showToast(message, 'info', options), [showToast])

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    warning,
    info,
    clearAll
  }
}

// Context-based toast provider for app-wide usage
const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const toast = useToast()

  return (
    <ToastContext.Provider value={toast}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToastContext(): ToastContextType {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider')
  }
  return context
}
