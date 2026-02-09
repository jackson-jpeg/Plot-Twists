/**
 * JSON File Database Adapter
 * Implements DatabaseAdapter interface using local JSON files
 * Used as fallback when Firestore is not configured
 */

import * as fs from 'fs'
import * as path from 'path'
import { DatabaseAdapter, WhereClause, QueryOptions, TransactionContext } from './adapter'

const DATA_DIR = path.join(process.cwd(), 'data')

// In-memory cache for each collection
const cache: Map<string, Map<string, unknown>> = new Map()

// Simple promise-based lock for transaction serialization (dev-only adapter)
let txnLock: Promise<void> = Promise.resolve()

/**
 * Ensure data directory exists
 */
function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

/**
 * Get file path for a collection
 */
function getFilePath(collection: string): string {
  return path.join(DATA_DIR, `${collection}.json`)
}

/**
 * Load collection from file into cache
 */
function loadCollection(collection: string): Map<string, unknown> {
  if (cache.has(collection)) {
    return cache.get(collection)!
  }

  const filePath = getFilePath(collection)
  const collectionData = new Map<string, unknown>()

  if (fs.existsSync(filePath)) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const data = JSON.parse(fileContent)
      if (data.items && Array.isArray(data.items)) {
        for (const item of data.items) {
          if (item.id) {
            collectionData.set(item.id, item)
          }
        }
      }
    } catch (error) {
      console.error(`Failed to load collection ${collection}:`, error)
    }
  }

  cache.set(collection, collectionData)
  return collectionData
}

/**
 * Save collection from cache to file
 */
function saveCollection(collection: string): void {
  ensureDataDir()
  const collectionData = cache.get(collection)
  if (!collectionData) return

  const filePath = getFilePath(collection)
  const data = {
    items: Array.from(collectionData.values()),
    savedAt: Date.now()
  }

  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error(`Failed to save collection ${collection}:`, error)
  }
}

/**
 * Evaluate a where clause against a document
 */
function evaluateWhereClause(doc: unknown, clause: WhereClause): boolean {
  const docObj = doc as Record<string, unknown>
  const value = docObj[clause.field]

  switch (clause.operator) {
    case '==':
      return value === clause.value
    case '!=':
      return value !== clause.value
    case '>':
      return (value as number) > (clause.value as number)
    case '<':
      return (value as number) < (clause.value as number)
    case '>=':
      return (value as number) >= (clause.value as number)
    case '<=':
      return (value as number) <= (clause.value as number)
    case 'in':
      return (clause.value as unknown[]).includes(value)
    case 'array-contains':
      return Array.isArray(value) && value.includes(clause.value)
    default:
      return false
  }
}

/**
 * JSON File implementation of DatabaseAdapter
 */
export class JsonAdapter implements DatabaseAdapter {
  private connected = false

  async connect(): Promise<void> {
    ensureDataDir()
    this.connected = true
  }

  async disconnect(): Promise<void> {
    // Save all collections before disconnecting
    for (const collection of cache.keys()) {
      saveCollection(collection)
    }
    this.connected = false
  }

  isConnected(): boolean {
    return this.connected
  }

  async get<T>(collection: string, id: string): Promise<T | null> {
    const collectionData = loadCollection(collection)
    const doc = collectionData.get(id)
    return doc as T | null
  }

  async set<T>(collection: string, id: string, data: T): Promise<void> {
    const collectionData = loadCollection(collection)
    collectionData.set(id, { ...data as object, id })
    saveCollection(collection)
  }

  async update<T>(collection: string, id: string, data: Partial<T>): Promise<void> {
    const collectionData = loadCollection(collection)
    const existing = collectionData.get(id)
    if (existing) {
      collectionData.set(id, { ...existing as object, ...data as object, id })
      saveCollection(collection)
    }
  }

  async delete(collection: string, id: string): Promise<void> {
    const collectionData = loadCollection(collection)
    collectionData.delete(id)
    saveCollection(collection)
  }

  async query<T>(
    collection: string,
    where?: WhereClause[],
    options?: QueryOptions
  ): Promise<T[]> {
    const collectionData = loadCollection(collection)
    let results = Array.from(collectionData.values())

    // Apply where clauses
    if (where && where.length > 0) {
      results = results.filter(doc => {
        return where.every(clause => evaluateWhereClause(doc, clause))
      })
    }

    // Apply ordering
    if (options?.orderBy) {
      const field = options.orderBy
      const direction = options.orderDirection || 'asc'
      results.sort((a, b) => {
        const aObj = a as Record<string, unknown>
        const bObj = b as Record<string, unknown>
        const aVal = aObj[field]
        const bVal = bObj[field]

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return direction === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal)
        }
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return direction === 'asc' ? aVal - bVal : bVal - aVal
        }
        return 0
      })
    }

    // Apply pagination
    if (options?.offset) {
      results = results.slice(options.offset)
    }
    if (options?.limit) {
      results = results.slice(0, options.limit)
    }

    return results as T[]
  }

  async batchSet<T>(collection: string, items: { id: string; data: T }[]): Promise<void> {
    const collectionData = loadCollection(collection)
    for (const item of items) {
      collectionData.set(item.id, { ...item.data as object, id: item.id })
    }
    saveCollection(collection)
  }

  async batchDelete(collection: string, ids: string[]): Promise<void> {
    const collectionData = loadCollection(collection)
    for (const id of ids) {
      collectionData.delete(id)
    }
    saveCollection(collection)
  }

  async getAll<T>(collection: string): Promise<T[]> {
    const collectionData = loadCollection(collection)
    return Array.from(collectionData.values()) as T[]
  }

  async count(collection: string, where?: WhereClause[]): Promise<number> {
    const results = await this.query(collection, where)
    return results.length
  }

  async runTransaction<T>(fn: (txn: TransactionContext) => Promise<T>): Promise<T> {
    let resolve: () => void
    const prevLock = txnLock
    txnLock = new Promise<void>((r) => { resolve = r })

    await prevLock

    try {
      const txn: TransactionContext = {
        async get<U>(collection: string, id: string): Promise<U | null> {
          const collectionData = loadCollection(collection)
          const doc = collectionData.get(id)
          return (doc as U) ?? null
        },
        async update<U>(collection: string, id: string, data: Partial<U>): Promise<void> {
          const collectionData = loadCollection(collection)
          const existing = collectionData.get(id)
          if (existing) {
            collectionData.set(id, { ...existing as object, ...data as object, id })
            saveCollection(collection)
          }
        }
      }
      return await fn(txn)
    } finally {
      resolve!()
    }
  }
}

// Export singleton instance
export const jsonAdapter = new JsonAdapter()
