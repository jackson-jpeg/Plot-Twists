import Link from 'next/link'

export default function NotFound() {
  return (
    <main
      className="flex items-center justify-center text-center"
      style={{ minHeight: '100dvh', padding: '24px' }}
    >
      <div className="max-w-md w-full px-6">
        <div className="mb-6 flex justify-center">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none"><path d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" stroke="var(--color-text-tertiary)" strokeWidth="1.5"/><path d="M10 8l6 4-6 4V8z" fill="var(--color-text-tertiary)"/></svg>
        </div>
        <h1
          className="text-4xl font-bold font-display mb-3"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Scene Not Found
        </h1>
        <p
          className="text-lg mb-8"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Looks like this scene was left on the cutting room floor. Let&apos;s get you back to the action.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2"
          style={{ background: 'var(--color-accent)', color: 'white', padding: '14px 28px', borderRadius: '14px', fontSize: '16px', fontWeight: 600, textDecoration: 'none' }}
        >
          Back to Main Stage
        </Link>
      </div>
    </main>
  )
}
