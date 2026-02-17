/**
 * Helper to get Authorization headers with Firebase ID token
 * for authenticated API requests.
 */

import { getFirebaseAuth } from './firebase'

/**
 * Returns headers object with Bearer token for authenticated API calls.
 * Throws if no user is signed in.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const auth = getFirebaseAuth()
  const user = auth?.currentUser
  if (!user) {
    throw new Error('Not authenticated')
  }
  const idToken = await user.getIdToken()
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${idToken}`,
  }
}
