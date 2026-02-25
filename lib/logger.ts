/**
 * Structured logger with LOG_LEVEL support.
 * - debug: silenced in production by default
 * - info: enabled in production (previously was silenced)
 * - warn/error: always logged
 *
 * Override with LOG_LEVEL env var: debug | info | warn | error
 */

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const
type LogLevel = keyof typeof LOG_LEVELS

function getLogLevel(): LogLevel {
  const env = process.env.LOG_LEVEL?.toLowerCase()
  if (env && env in LOG_LEVELS) return env as LogLevel

  // Default: info in production, debug in development
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug'
}

const currentLevel = getLogLevel()

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel]
}

function formatArgs(level: string, args: unknown[]): unknown[] {
  return [`[${level}]`, ...args]
}

export const logger = {
  debug(...args: unknown[]) {
    if (shouldLog('debug')) {
      console.debug(...formatArgs('DEBUG', args))
    }
  },

  info(...args: unknown[]) {
    if (shouldLog('info')) {
      console.log(...formatArgs('INFO', args))
    }
  },

  warn(...args: unknown[]) {
    if (shouldLog('warn')) {
      console.warn(...formatArgs('WARN', args))
    }
  },

  error(...args: unknown[]) {
    if (shouldLog('error')) {
      console.error(...formatArgs('ERROR', args))
    }
  },
}
