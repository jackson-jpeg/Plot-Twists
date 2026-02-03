/**
 * Database Module
 * Exports the appropriate database adapter based on configuration
 */

import { DatabaseAdapter, Collections, CollectionName } from './adapter'
import { firestoreAdapter } from './firestore'
import { jsonAdapter } from './json'

// Determine which adapter to use based on environment
const useFirestore = Boolean(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
)

/**
 * Get the configured database adapter
 * Falls back to JSON adapter if Firestore is not configured
 */
export function getDatabase(): DatabaseAdapter {
  return useFirestore ? firestoreAdapter : jsonAdapter
}

/**
 * Initialize the database connection
 */
export async function initializeDatabase(): Promise<void> {
  const db = getDatabase()

  if (!db.isConnected()) {
    try {
      await db.connect()
      console.log(`Database connected using ${useFirestore ? 'Firestore' : 'JSON file'} adapter`)
    } catch (error) {
      if (useFirestore) {
        console.warn('Firestore connection failed, falling back to JSON adapter')
        await jsonAdapter.connect()
      } else {
        throw error
      }
    }
  }
}

// Export types and constants
export { Collections } from './adapter'
export type { DatabaseAdapter, CollectionName, WhereClause, QueryOptions } from './adapter'
