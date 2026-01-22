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

        {/* How to Play - Timeline */}
        {mode === 'host' ? (
          <section>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--color-accent)',
                marginBottom: '16px',
                marginTop: 0
              }}
            >
              🎪 Hosting a Game
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { icon: '🎮', color: 'var(--color-accent)', text: 'Choose a game mode and click "Create Room"' },
                { icon: '🔗', color: 'var(--color-accent-2)', text: 'Share the 4-letter room code with your players' },
                { icon: '🎭', color: 'var(--color-warning)', text: 'Wait in the Green Room for players to join' },
                { icon: '🎴', color: 'var(--color-accent)', text: 'Click "Deal Cards" to distribute random prompts' },
                { icon: '⌨️', color: 'var(--color-accent-2)', text: 'Press Space to start each performance' },
                { icon: '⏭️', color: 'var(--color-warning)', text: 'Press Space again to move to next player' },
                { icon: '🗳️', color: 'var(--color-accent)', text: 'Click "Start Voting" after all performances' },
                { icon: '🏆', color: 'var(--color-accent-2)', text: 'View results and celebrate the winner!' }
              ].map((step, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: 'var(--color-surface)',
                    borderRadius: '8px',
                    borderLeft: `3px solid ${step.color}`
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      background: `${step.color}20`,
                      borderRadius: '50%',
                      flexShrink: 0
                    }}
                  >
                    {step.icon}
                  </div>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
                    {step.text}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--color-accent)',
                marginBottom: '16px',
                marginTop: 0
              }}
            >
              🎪 Joining a Game
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { icon: '🔗', color: 'var(--color-accent)', text: 'Get the 4-letter room code from your host' },
                { icon: '✍️', color: 'var(--color-accent-2)', text: 'Enter the code and choose a fun nickname' },
                { icon: '🎭', color: 'var(--color-warning)', text: 'Wait in the lobby for the game to start' },
                { icon: '🎴', color: 'var(--color-accent)', text: 'Pick your cards when selection begins' },
                { icon: '💭', color: 'var(--color-accent-2)', text: 'Review the script and get ready to perform' },
                { icon: '🎬', color: 'var(--color-warning)', text: 'Follow along and perform your lines!' },
                { icon: '🗳️', color: 'var(--color-accent)', text: 'Vote for your favorite performance' },
                { icon: '🎉', color: 'var(--color-accent-2)', text: 'Celebrate the winner and play again!' }
              ].map((step, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: 'var(--color-surface)',
                    borderRadius: '8px',
                    borderLeft: `3px solid ${step.color}`
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      background: `${step.color}20`,
                      borderRadius: '50%',
                      flexShrink: 0
                    }}
                  >
                    {step.icon}
                  </div>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
                    {step.text}
                  </span>
                </div>
              ))}
            </div>
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
              marginBottom: '16px',
              marginTop: 0
            }}
          >
            💡 Pro Tips
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
            {[
              { icon: '🧠', text: "Don't overthink it - go with your gut!" },
              { icon: '✅', text: 'Yes, and... - build on ideas' },
              { icon: '🎪', text: 'Embrace the weird combinations' },
              { icon: '💪', text: 'Commit fully with confidence' },
              { icon: '😊', text: 'Watch the mood indicator' },
              { icon: '🎉', text: "Have fun! It's about creativity" }
            ].map((tip, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  padding: '10px',
                  background: 'var(--color-surface)',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)'
                }}
              >
                <span style={{ fontSize: '18px', flexShrink: 0 }}>{tip.icon}</span>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px', lineHeight: 1.4 }}>
                  {tip.text}
                </span>
              </div>
            ))}
          </div>
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
