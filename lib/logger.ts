/**
 * Simple logger utility that suppresses info/debug in production.
 * warn and error always log (important for monitoring).
 */

const isProduction = process.env.NODE_ENV === 'production'

function formatArgs(level: string, args: unknown[]): unknown[] {
  return [`[${level}]`, ...args]
}

export const logger = {
  debug(...args: unknown[]) {
    if (!isProduction) {
      console.debug(...formatArgs('DEBUG', args))
    }
  },

  info(...args: unknown[]) {
    if (!isProduction) {
      console.log(...formatArgs('INFO', args))
    }
  },

  warn(...args: unknown[]) {
    console.warn(...formatArgs('WARN', args))
  },

  error(...args: unknown[]) {
    console.error(...formatArgs('ERROR', args))
  },
}
