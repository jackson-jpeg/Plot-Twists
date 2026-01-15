'use client'

import { Modal } from './Modal'

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  mode?: 'host' | 'join'
}

export function OnboardingModal({ isOpen, onClose, mode = 'join' }: OnboardingModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="How to Play Plot Twists" maxWidth="700px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="onboarding-content">
        {/* Game Overview */}
        <section>
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--color-accent)',
              marginBottom: '12px',
              marginTop: 0
            }}
          >
            🎭 What is Plot Twists?
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Plot Twists is an improv storytelling game where you draw random cards and create
            compelling stories on the spot. Perfect for theater kids, improv enthusiasts, and
            anyone who loves creative storytelling!
          </p>
        </section>

        {/* Game Modes */}
        <section>
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--color-accent)',
              marginBottom: '12px',
              marginTop: 0
            }}
          >
            🎮 Game Modes
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                padding: '12px',
                background: 'var(--color-surface)',
                borderRadius: '8px',
                border: '1px solid var(--color-border)'
              }}
            >
              <strong style={{ color: 'var(--color-text-primary)' }}>Solo Mode</strong>
              <p style={{ color: 'var(--color-text-secondary)', margin: '4px 0 0', fontSize: '14px' }}>
                Practice your improv skills alone. Get random prompts and perform for yourself.
                Great for warming up or building confidence!
              </p>
            </div>
            <div
              style={{
                padding: '12px',
                background: 'var(--color-surface)',
                borderRadius: '8px',
                border: '1px solid var(--color-border)'
              }}
            >
              <strong style={{ color: 'var(--color-text-primary)' }}>Head-to-Head Mode</strong>
              <p style={{ color: 'var(--color-text-secondary)', margin: '4px 0 0', fontSize: '14px' }}>
                Two players compete with the same prompt. Both perform their stories, then vote for
                their favorite. May the best storyteller win!
              </p>
            </div>
            <div
              style={{
                padding: '12px',
                background: 'var(--color-surface)',
                borderRadius: '8px',
                border: '1px solid var(--color-border)'
              }}
            >
              <strong style={{ color: 'var(--color-text-primary)' }}>Ensemble Mode</strong>
              <p style={{ color: 'var(--color-text-secondary)', margin: '4px 0 0', fontSize: '14px' }}>
                Up to 6 players compete! Each player gets a unique prompt. Everyone performs, then
                all players vote for their favorite story. Perfect for parties and game nights!
              </p>
            </div>
          </div>
        </section>

        {/* How to Play */}
        {mode === 'host' ? (
          <section>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--color-accent)',
                marginBottom: '12px',
                marginTop: 0
              }}
            >
              🎪 Hosting a Game
            </h3>
            <ol style={{ color: 'var(--color-text-secondary)', lineHeight: 1.8, paddingLeft: '20px', margin: 0 }}>
              <li>Choose a game mode and click "Create Room"</li>
              <li>Share the 4-letter room code with your players</li>
              <li>
                Wait in the Green Room for players to join (they'll answer trivia while waiting!)
              </li>
              <li>Click "Deal Cards" to distribute random prompts to everyone</li>
              <li>
                Review each player's prompt on your screen, then press <kbd style={{ background: 'var(--color-surface)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--color-border)', fontFamily: 'monospace' }}>Space</kbd> to start their performance
              </li>
              <li>Press <kbd style={{ background: 'var(--color-surface)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--color-border)', fontFamily: 'monospace' }}>Space</kbd> again to end their performance and move to the next player</li>
              <li>After all performances, click "Start Voting" to let players vote</li>
              <li>View results and see who won!</li>
            </ol>
          </section>
        ) : (
          <section>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--color-accent)',
                marginBottom: '12px',
                marginTop: 0
              }}
            >
              🎪 Joining a Game
            </h3>
            <ol style={{ color: 'var(--color-text-secondary)', lineHeight: 1.8, paddingLeft: '20px', margin: 0 }}>
              <li>Get the 4-letter room code from your host</li>
              <li>Enter the room code and choose a fun nickname</li>
              <li>Wait in the Green Room (answer trivia questions while you wait!)</li>
              <li>When the host deals cards, you'll see your random prompt</li>
              <li>Think about your story while waiting for your turn</li>
              <li>When it's your turn, perform your story for everyone!</li>
              <li>After all performances, vote for your favorite story (can't vote for yourself)</li>
              <li>See who won and celebrate! 🎉</li>
            </ol>
          </section>
        )}

        {/* The Three Cards */}
        <section>
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--color-accent)',
              marginBottom: '12px',
              marginTop: 0
            }}
          >
            🃏 Understanding Your Prompt
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: '0 0 12px' }}>
            Each prompt consists of three cards:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🎭</span>
              <strong style={{ color: 'var(--color-text-primary)' }}>Character:</strong>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                Who you're playing in your story
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🏛️</span>
              <strong style={{ color: 'var(--color-text-primary)' }}>Setting:</strong>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                Where your story takes place
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>⚡</span>
              <strong style={{ color: 'var(--color-text-primary)' }}>Circumstance:</strong>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                The dramatic situation or twist
              </span>
            </div>
          </div>
        </section>

        {/* Tips */}
        <section>
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--color-accent)',
              marginBottom: '12px',
              marginTop: 0
            }}
          >
            💡 Pro Tips
          </h3>
          <ul style={{ color: 'var(--color-text-secondary)', lineHeight: 1.8, paddingLeft: '20px', margin: 0 }}>
            <li>Don't overthink it - improv is about going with your gut!</li>
            <li>Yes, and... - build on ideas instead of shutting them down</li>
            <li>Embrace the weird - the stranger the combination, the more fun!</li>
            <li>Commit fully - even if it's silly, sell it with confidence</li>
            <li>Watch the mood indicator to gauge your performance energy</li>
            <li>Have fun! This isn't about being perfect, it's about being creative</li>
          </ul>
        </section>

        {/* Call to Action */}
        <div style={{ textAlign: 'center', paddingTop: '12px' }}>
          <button
            onClick={onClose}
            style={{
              background: 'var(--color-accent)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 32px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(204, 130, 89, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            Got it! Let's Play 🎭
          </button>
        </div>
      </div>
    </Modal>
  )
}
