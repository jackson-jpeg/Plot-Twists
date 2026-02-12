/**
 * Firestore Database Adapter
 * Implements DatabaseAdapter interface using Firebase Firestore
 */

import type { DatabaseAdapter, WhereClause, QueryOptions, TransactionContext } from './adapter'
import type { Firestore as FirestoreType } from 'firebase-admin/firestore'
import { logger } from '../../lib/logger'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let adminInstance: any = null
let db: FirestoreType | null = null
let isInitialized = false

/**
 * Initialize Firebase Admin SDK for server-side use
 * Requires FIREBASE_SERVICE_ACCOUNT_KEY environment variable
 */
async function initializeFirebaseAdmin(): Promise<FirestoreType | null> {
  if (isInitialized) return db

  try {
    const admin = (await import('firebase-admin')).default

    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

    if (!serviceAccountKey || !projectId) {
      logger.info('Firebase Admin not configured - service account key missing')
      isInitialized = true
      return null
    }

    // Check if already initialized
    if (admin.apps.length === 0) {
      const serviceAccount = JSON.parse(serviceAccountKey)
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId
      })
    }

    db = admin.firestore()
    db.settings({ ignoreUndefinedProperties: true })
    adminInstance = admin
    isInitialized = true
    logger.info('Firebase Admin initialized successfully')
    return db
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin:', error)
    isInitialized = true
    return null
  }
}

/**
 * Firestore implementation of DatabaseAdapter
 */
export class FirestoreAdapter implements DatabaseAdapter {
  private db: FirestoreType | null = null
  private connected = false

  async connect(): Promise<void> {
    this.db = await initializeFirebaseAdmin()
    this.connected = this.db !== null
    if (!this.connected) {
      throw new Error('Failed to connect to Firestore')
    }
  }

  async disconnect(): Promise<void> {
    // Firebase Admin SDK manages its own connection pool
    this.connected = false
  }

  isConnected(): boolean {
    return this.connected && this.db !== null
  }

  private ensureConnected(): FirestoreType {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.')
    }
    return this.db
  }

  async get<T>(collection: string, id: string): Promise<T | null> {
    const db = this.ensureConnected()
    const doc = await db.collection(collection).doc(id).get()
    if (!doc.exists) return null
    return { id: doc.id, ...doc.data() } as T
  }

  async set<T>(collection: string, id: string, data: T): Promise<void> {
    const db = this.ensureConnected()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.collection(collection).doc(id).set(data as any)
  }

  async update<T>(collection: string, id: string, data: Partial<T>): Promise<void> {
    const db = this.ensureConnected()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.collection(collection).doc(id).update(data as any)
  }

  async delete(collection: string, id: string): Promise<void> {
    const db = this.ensureConnected()
    await db.collection(collection).doc(id).delete()
  }

  async query<T>(
    collection: string,
    where?: WhereClause[],
    options?: QueryOptions
  ): Promise<T[]> {
    const db = this.ensureConnected()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = db.collection(collection)

    // Apply where clauses
    if (where && where.length > 0) {
      for (const clause of where) {
        query = query.where(clause.field, clause.operator, clause.value)
      }
    }

    // Apply ordering
    if (options?.orderBy) {
      query = query.orderBy(options.orderBy, options.orderDirection || 'asc')
    }

    // Apply pagination
    if (options?.offset) {
      query = query.offset(options.offset)
    }
    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const snapshot = await query.get()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    })) as T[]
  }

  async batchSet<T>(collection: string, items: { id: string; data: T }[]): Promise<void> {
    const db = this.ensureConnected()
    const batch = db.batch()

    for (const item of items) {
      const ref = db.collection(collection).doc(item.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      batch.set(ref, item.data as any)
    }

    await batch.commit()
  }

  async batchDelete(collection: string, ids: string[]): Promise<void> {
    const db = this.ensureConnected()
    const batch = db.batch()

    for (const id of ids) {
      const ref = db.collection(collection).doc(id)
      batch.delete(ref)
    }

    await batch.commit()
  }

  async getAll<T>(collection: string): Promise<T[]> {
    const db = this.ensureConnected()
    const snapshot = await db.collection(collection).get()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    })) as T[]
  }

  async count(collection: string, where?: WhereClause[]): Promise<number> {
    const db = this.ensureConnected()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = db.collection(collection)

    if (where && where.length > 0) {
      for (const clause of where) {
        query = query.where(clause.field, clause.operator, clause.value)
      }
    }

    const snapshot = await query.count().get()
    return snapshot.data().count
  }

  async runTransaction<T>(fn: (txn: TransactionContext) => Promise<T>): Promise<T> {
    const db = this.ensureConnected()
    return db.runTransaction(async (firestoreTxn) => {
      const txn: TransactionContext = {
        async get<U>(collection: string, id: string): Promise<U | null> {
          const docRef = db.collection(collection).doc(id)
          const doc = await firestoreTxn.get(docRef)
          if (!doc.exists) return null
          return { id: doc.id, ...doc.data() } as U
        },
        async update<U>(collection: string, id: string, data: Partial<U>): Promise<void> {
          const docRef = db.collection(collection).doc(id)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          firestoreTxn.update(docRef, data as any)
        }
      }
      return fn(txn)
    })
  }
}

// Export singleton instance
export const firestoreAdapter = new FirestoreAdapter()

/**
 * Get Firebase Storage bucket for file uploads
 * Returns null if Firebase is not configured
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getStorage(): Promise<any | null> {
  if (!adminInstance) {
    await initializeFirebaseAdmin()
  }
  if (!adminInstance) return null
  const bucket = process.env.FIREBASE_STORAGE_BUCKET
  return bucket ? adminInstance.storage().bucket(bucket) : null
}
