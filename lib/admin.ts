/**
 * Admin configuration
 * Admin users bypass script credit limits and have elevated privileges.
 */

const ADMIN_EMAILS = new Set([
  'jmsanger@me.com',
  'realjacksons@gmail.com'
])

const ADMIN_PHONES = new Set([
  '+19418550519',
  '9418550519'
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

export function isAdminUser(user: { email?: string | null; phoneNumber?: string | null }): boolean {
  return isAdminEmail(user.email) || isAdminPhone(user.phoneNumber)
}
