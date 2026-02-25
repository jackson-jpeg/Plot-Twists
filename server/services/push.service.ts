import { logger } from '../../lib/logger'

/**
 * Send a push notification to a specific user.
 * Looks up their tokens in Firestore and sends via Firebase Admin.
 */
export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  try {
    const admin = await getFirebaseAdmin()
    if (!admin) return

    const db = admin.firestore()
    const snapshot = await db.collection('push_tokens').where('userId', '==', userId).get()

    if (snapshot.empty) return

    const messages: Array<{ token: string; notification: { title: string; body: string }; data: Record<string, string> }> = []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    snapshot.docs.forEach((doc: any) => {
      const d = doc.data()
      messages.push({
        token: d.token,
        notification: { title, body },
        data: data || {},
      })
    })

    const result = await admin.messaging().sendEach(messages)

    // Clean up invalid tokens
    const batch = db.batch()
    let cleanupCount = 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result.responses.forEach((resp: any, i: number) => {
      if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
        batch.delete(snapshot.docs[i].ref)
        cleanupCount++
      }
    })

    if (cleanupCount > 0) {
      await batch.commit()
      logger.info(`[Push] Cleaned up ${cleanupCount} invalid tokens for user ${userId}`)
    }
  } catch (error) {
    logger.error('[Push] sendPushToUser failed:', error)
  }
}

/**
 * Send a push notification to all players in a room.
 */
export async function sendPushToRoom(
  roomCode: string,
  title: string,
  body: string,
  playerUids: string[],
  excludeUid?: string
): Promise<void> {
  const uids = excludeUid ? playerUids.filter(uid => uid !== excludeUid) : playerUids
  await Promise.allSettled(
    uids.map(uid => sendPushToUser(uid, title, body, { roomCode }))
  )
}

/** Lazily load Firebase Admin SDK */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let adminInstance: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getFirebaseAdmin(): Promise<any> {
  if (adminInstance) return adminInstance

  try {
    const admin = await import('firebase-admin')
    if (admin.default.apps.length === 0) {
      admin.default.initializeApp({
        credential: admin.default.credential.applicationDefault(),
      })
    }
    adminInstance = admin.default
    return adminInstance
  } catch (error) {
    logger.warn('[Push] Firebase Admin not available:', error)
    return null
  }
}
