/**
 * Payment Service
 * Records and retrieves payment transaction history.
 */

import type { PaymentTransaction, PaymentTransactionType, PaymentTransactionStatus } from '../../lib/types'
import { getDatabase, Collections } from '../db'

interface RecordTransactionInput {
  userId: string
  type: PaymentTransactionType
  stripeEventId: string
  packageId: string
  packageLabel: string
  creditsAdded: number
  amountCents: number
  status: PaymentTransactionStatus
}

/**
 * Record a payment transaction in the database.
 */
export async function recordTransaction(input: RecordTransactionInput): Promise<PaymentTransaction> {
  const db = getDatabase()
  const id = `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  const transaction: PaymentTransaction = {
    id,
    userId: input.userId,
    type: input.type,
    stripeEventId: input.stripeEventId,
    packageId: input.packageId,
    packageLabel: input.packageLabel,
    creditsAdded: input.creditsAdded,
    amountCents: input.amountCents,
    createdAt: new Date().toISOString(),
    status: input.status
  }

  await db.set(Collections.PAYMENT_TRANSACTIONS, id, transaction)
  console.log(`[Payment] Recorded ${input.type} transaction ${id} for user ${input.userId}`)

  return transaction
}

/**
 * Get all transactions for a user, ordered by most recent first.
 */
export async function getUserTransactions(userId: string): Promise<PaymentTransaction[]> {
  const db = getDatabase()

  const transactions = await db.query<PaymentTransaction>(
    Collections.PAYMENT_TRANSACTIONS,
    [{ field: 'userId', operator: '==', value: userId }],
    { orderBy: 'createdAt', orderDirection: 'desc', limit: 50 }
  )

  return transactions
}
