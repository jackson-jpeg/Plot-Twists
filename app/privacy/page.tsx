import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | Plot Twists',
  description: 'Privacy policy for Plot Twists — the improv comedy game.',
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-dvh py-12 px-4" style={{ background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}>
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm mb-8 transition-colors"
          style={{ color: 'var(--color-purple)' }}
        >
          <span>&larr;</span> Back to Plot Twists
        </Link>

        <h1 className="text-3xl font-bold mb-2 font-display" style={{ color: 'var(--color-text-primary)' }}>
          Privacy Policy
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--color-text-tertiary)' }}>
          Last updated: February 12, 2026
        </p>

        <div className="space-y-6 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          <section>
            <h2 className="text-lg font-semibold mb-2 font-display" style={{ color: 'var(--color-text-primary)' }}>1. Introduction</h2>
            <p>
              Plot Twists (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the Plot Twists mobile application and
              website at plot-twists.com (the &ldquo;Service&rdquo;). This Privacy Policy explains how we collect, use, and protect
              your information when you use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2 font-display" style={{ color: 'var(--color-text-primary)' }}>2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Email address</strong> &mdash; Used for account authentication.</li>
              <li><strong>Display name</strong> &mdash; A nickname you choose that is shown to other players.</li>
              <li><strong>Game history</strong> &mdash; Records of games you&apos;ve played including scripts, characters, and votes.</li>
              <li><strong>Player statistics</strong> &mdash; Win/loss records, streaks, and performance data.</li>
              <li><strong>Payment information</strong> &mdash; Processed securely through Stripe (web) or Apple In-App Purchase (iOS). We do not store credit card numbers.</li>
              <li><strong>Device information</strong> &mdash; Anonymous analytics data including device type and app version, collected via Vercel Analytics.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2 font-display" style={{ color: 'var(--color-text-primary)' }}>3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To authenticate your account and provide the Service.</li>
              <li>To generate AI-powered comedy scripts tailored to your game session.</li>
              <li>To track your game statistics and display leaderboards.</li>
              <li>To process credit purchases and manage your credit balance.</li>
              <li>To improve the Service and fix bugs.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2 font-display" style={{ color: 'var(--color-text-primary)' }}>4. Third-Party Services</h2>
            <p className="mb-2">We use the following third-party services:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Clerk</strong> &mdash; Authentication. <a href="https://clerk.com/legal/privacy" className="underline" style={{ color: 'var(--color-purple)' }}>Privacy Policy</a></li>
              <li><strong>Firebase (Google)</strong> &mdash; Database and storage. <a href="https://firebase.google.com/support/privacy" className="underline" style={{ color: 'var(--color-purple)' }}>Privacy Policy</a></li>
              <li><strong>Stripe</strong> &mdash; Payment processing (web only). <a href="https://stripe.com/privacy" className="underline" style={{ color: 'var(--color-purple)' }}>Privacy Policy</a></li>
              <li><strong>Apple</strong> &mdash; In-App Purchase processing (iOS only). <a href="https://www.apple.com/legal/privacy/" className="underline" style={{ color: 'var(--color-purple)' }}>Privacy Policy</a></li>
              <li><strong>Anthropic (Claude)</strong> &mdash; AI script generation. Card selections (not personal data) are sent to generate scripts. <a href="https://www.anthropic.com/privacy" className="underline" style={{ color: 'var(--color-purple)' }}>Privacy Policy</a></li>
              <li><strong>Vercel</strong> &mdash; Hosting and anonymous analytics. <a href="https://vercel.com/legal/privacy-policy" className="underline" style={{ color: 'var(--color-purple)' }}>Privacy Policy</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2 font-display" style={{ color: 'var(--color-text-primary)' }}>5. Data Retention</h2>
            <p>
              We retain your account data for as long as your account is active. Game history is retained indefinitely
              to support replays and leaderboards. You may request deletion of your account and all associated data at
              any time (see Section 7).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2 font-display" style={{ color: 'var(--color-text-primary)' }}>6. Data Security</h2>
            <p>
              We use industry-standard security measures including encrypted connections (HTTPS/WSS), Firebase security
              rules, and secure payment processing. However, no method of electronic transmission is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2 font-display" style={{ color: 'var(--color-text-primary)' }}>7. Your Rights &amp; Account Deletion</h2>
            <p>
              You have the right to:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Delete your account and all associated data. You can do this from the Account Settings section
                in your profile, or by contacting us at the email below.</li>
            </ul>
            <p className="mt-2">
              When you delete your account, we permanently remove your profile, player statistics, game history records,
              and any linked payment data. This action cannot be undone.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2 font-display" style={{ color: 'var(--color-text-primary)' }}>8. Children&apos;s Privacy</h2>
            <p>
              The Service is not intended for children under 13. We do not knowingly collect personal information from
              children under 13. If you believe we have collected such information, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2 font-display" style={{ color: 'var(--color-text-primary)' }}>9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes by posting
              the new policy on this page with an updated date.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2 font-display" style={{ color: 'var(--color-text-primary)' }}>10. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or wish to exercise your data rights, contact us at:
            </p>
            <p className="mt-2 font-medium" style={{ color: 'var(--color-text-primary)' }}>
              privacy@plot-twists.com
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t text-center text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-disabled)' }}>
          <Link href="/terms" className="underline" style={{ color: 'var(--color-text-tertiary)' }}>Terms of Service</Link>
          {' '}&middot;{' '}
          <Link href="/" style={{ color: 'var(--color-text-tertiary)' }}>Plot Twists</Link>
        </div>
      </div>
    </main>
  )
}
