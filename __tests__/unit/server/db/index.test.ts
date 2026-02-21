/**
 * Database Adapter Tests
 * Tests the adapter selection and fallback logic.
 */

describe('Database Adapter', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  it('should use JSON adapter when Firestore env vars are not set', () => {
    delete process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

    const { getDatabase } = require('../../../../server/db')
    const db = getDatabase()

    // JSON adapter should be the one returned
    expect(db).toBeDefined()
    expect(typeof db.isConnected).toBe('function')
  })

  it('should export getDatabase and initializeDatabase', () => {
    const dbModule = require('../../../../server/db')
    expect(typeof dbModule.getDatabase).toBe('function')
    expect(typeof dbModule.initializeDatabase).toBe('function')
    expect(dbModule.Collections).toBeDefined()
  })
})
