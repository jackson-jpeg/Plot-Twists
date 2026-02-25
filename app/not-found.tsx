import Link from 'next/link'

export default function NotFound() {
  return (
    <main
      className="page-container items-center justify-center text-center"
      style={{ minHeight: '100dvh' }}
    >
      <div className="max-w-md w-full px-6">
        <div className="text-8xl mb-6">🎬</div>
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
          className="btn btn-primary btn-large inline-flex items-center gap-2"
        >
          Back to Main Stage
        </Link>
      </div>
    </main>
  )
}
