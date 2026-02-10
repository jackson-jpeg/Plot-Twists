/**
 * Database Adapter Interface
 * Provides abstraction layer for database operations
 * Enables switching between storage backends (JSON, Firestore, etc.)
 */

export interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
}

export interface WhereClause {
  field: string
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'in' | 'array-contains'
  value: unknown
}

/**
 * Transaction context for atomic read-modify-write operations
 */
export interface TransactionContext {
  get<T>(collection: string, id: string): Promise<T | null>
  update<T>(collection: string, id: string, data: Partial<T>): Promise<void>
}

/**
 * Generic database adapter interface
 * All storage implementations should implement this interface
 */
export interface DatabaseAdapter {
  // Connection management
  connect(): Promise<void>
  disconnect(): Promise<void>
  isConnected(): boolean

  // Document operations
  get<T>(collection: string, id: string): Promise<T | null>
  set<T>(collection: string, id: string, data: T): Promise<void>
  update<T>(collection: string, id: string, data: Partial<T>): Promise<void>
  delete(collection: string, id: string): Promise<void>

  // Query operations
  query<T>(
    collection: string,
    where?: WhereClause[],
    options?: QueryOptions
  ): Promise<T[]>

  // Batch operations
  batchSet<T>(collection: string, items: { id: string; data: T }[]): Promise<void>
  batchDelete(collection: string, ids: string[]): Promise<void>

  // Collection operations
  getAll<T>(collection: string): Promise<T[]>
  count(collection: string, where?: WhereClause[]): Promise<number>

  // Transaction operations
  runTransaction<T>(fn: (txn: TransactionContext) => Promise<T>): Promise<T>
}

/**
 * Collection names used in the application
 */
export const Collections = {
  USERS: 'users',
  PLAYER_STATS: 'playerStats',
  GAME_HISTORY: 'gameHistory',
  CARD_PACKS: 'cardPacks',
  ROOMS: 'rooms',
  MIGRATIONS: 'migrations',
  STRIPE_EVENTS: 'stripeEvents',
  PAYMENT_TRANSACTIONS: 'paymentTransactions'
} as const

export type CollectionName = typeof Collections[keyof typeof Collections]
