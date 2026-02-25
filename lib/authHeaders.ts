/**
 * Helper to get Authorization headers with Clerk session token
 * for authenticated API requests.
 */

/**
 * Returns headers object with Bearer token for authenticated API calls.
 * Must be called from a component/hook context where Clerk is available.
 *
 * Usage: Pass `getToken` from Clerk's `useAuth()` hook:
 *   const { getToken } = useAuth()
 *   const headers = await getAuthHeaders(getToken)
 */
export async function getAuthHeaders(
  getToken: () => Promise<string | null>
): Promise<Record<string, string>> {
  const token = await getToken()
  if (!token) {
    throw new Error('Not authenticated')
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}
