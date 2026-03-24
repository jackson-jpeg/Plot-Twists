/**
 * Admin configuration
 * Admin users bypass script credit limits and have elevated privileges.
 * Checks by Clerk user ID, email, or phone number.
 */

const ADMIN_EMAILS = new Set([
  'jmsanger@me.com',
  'realjacksons@gmail.com'
])

const ADMIN_PHONES = new Set([
  '+19418550519',
  '9418550519',
  '+18139069690',
  '8139069690'
])

// Clerk user IDs for admin accounts (fallback when email/phone isn't in the DB)
const ADMIN_USER_IDS = new Set([
  'user_3BJzFSLmQBUyRJXlx3EKp9ik07K',
])

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false
  return ADMIN_EMAILS.has(email.toLowerCase())
}

export function isAdminPhone(phone: string | undefined | null): boolean {
  if (!phone) return false
  const normalized = phone.replace(/\D/g, '')
  for (const p of ADMIN_PHONES) {
    if (p.replace(/\D/g, '') === normalized) return true
  }
  return false
}

export function isAdminUserId(uid: string | undefined | null): boolean {
  if (!uid) return false
  return ADMIN_USER_IDS.has(uid)
}

export function isAdminUser(user: { id?: string; uid?: string; email?: string | null; phoneNumber?: string | null }): boolean {
  return isAdminEmail(user.email) || isAdminPhone(user.phoneNumber) || isAdminUserId(user.id) || isAdminUserId(user.uid)
}
