/**
 * User-friendly error message mapping for Firebase Auth errors
 */

const authErrorMessages: Record<string, string> = {
  // Phone Auth errors
  'auth/invalid-phone-number': 'Please enter a valid phone number',
  'auth/missing-phone-number': 'Please enter a phone number',
  'auth/code-expired': 'Code expired. Please request a new one',
  'auth/invalid-verification-code': 'Invalid code. Please check and try again',
  'auth/too-many-requests': 'Too many attempts. Please try again later',
  'auth/quota-exceeded': 'SMS quota exceeded. Please try again later',
  'auth/user-disabled': 'This account has been disabled',
  'auth/operation-not-allowed': 'Phone authentication is not enabled',
  'auth/captcha-check-failed': 'reCAPTCHA verification failed. Please try again',
  'auth/missing-verification-code': 'Please enter the verification code',
  'auth/missing-verification-id': 'Verification session expired. Please request a new code',

  // Email Auth errors
  'auth/email-already-in-use': 'This email is already registered',
  'auth/invalid-email': 'Please enter a valid email address',
  'auth/weak-password': 'Password should be at least 6 characters',
  'auth/user-not-found': 'No account found with this email',
  'auth/wrong-password': 'Incorrect password',

  // Account Linking errors
  'auth/credential-already-in-use': 'This account is already linked to another user',
  'auth/provider-already-linked': 'This provider is already linked to your account',
  'auth/requires-recent-login': 'Please sign in again to complete this action',

  // General errors
  'auth/network-request-failed': 'Network error. Please check your connection',
  'auth/popup-closed-by-user': 'Sign in was cancelled',
  'auth/cancelled-popup-request': 'Sign in was cancelled',
  'auth/popup-blocked': 'Sign in popup was blocked. Please allow popups for this site',
  'auth/internal-error': 'An error occurred. Please try again',
}

/**
 * Get a user-friendly error message for a Firebase Auth error code
 */
export function getAuthErrorMessage(errorCode: string): string {
  return authErrorMessages[errorCode] || 'An unexpected error occurred. Please try again'
}

/**
 * Extract error code from Firebase error
 */
export function extractFirebaseErrorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    return (error as { code: string }).code
  }
  return 'unknown'
}

/**
 * Get user-friendly message from any Firebase error
 */
export function getFirebaseErrorMessage(error: unknown): string {
  const code = extractFirebaseErrorCode(error)
  return getAuthErrorMessage(code)
}
