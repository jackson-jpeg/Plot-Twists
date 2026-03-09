import { useAudienceStore } from '@/stores/audienceStore'
import type { SpectatorMessage } from '@/lib/types'

const makeMessage = (id: string): SpectatorMessage => ({
  id,
  senderId: `sender-${id}`,
  senderName: `User ${id}`,
  text: `Message ${id}`,
  timestamp: Date.now(),
  isPreset: false,
})

beforeEach(() => {
  useAudienceStore.getState().reset()
})

describe('audienceStore', () => {
  it('has correct initial defaults', () => {
    const state = useAudienceStore.getState()
    expect(state.spectatorMessages).toEqual([])
    expect(state.greenRoomQuestion).toBeNull()
    expect(state.chaosCooldown).toBe(false)
  })

  describe('spectatorMessages', () => {
    it('sets messages', () => {
      const messages = [makeMessage('1'), makeMessage('2')]
      useAudienceStore.getState().setSpectatorMessages(messages)
      expect(useAudienceStore.getState().spectatorMessages).toEqual(messages)
    })

    it('adds a single message', () => {
      useAudienceStore.getState().addMessage(makeMessage('1'))
      expect(useAudienceStore.getState().spectatorMessages).toHaveLength(1)
      expect(useAudienceStore.getState().spectatorMessages[0].id).toBe('1')
    })

    it('accumulates messages', () => {
      useAudienceStore.getState().addMessage(makeMessage('1'))
      useAudienceStore.getState().addMessage(makeMessage('2'))
      useAudienceStore.getState().addMessage(makeMessage('3'))
      const msgs = useAudienceStore.getState().spectatorMessages
      expect(msgs).toHaveLength(3)
      expect(msgs.map((m) => m.id)).toEqual(['1', '2', '3'])
    })
  })

  describe('greenRoomQuestion', () => {
    it('sets a question', () => {
      useAudienceStore.getState().setGreenRoomQuestion('What is your favorite color?')
      expect(useAudienceStore.getState().greenRoomQuestion).toBe('What is your favorite color?')
    })

    it('clears the question with null', () => {
      useAudienceStore.getState().setGreenRoomQuestion('A question')
      useAudienceStore.getState().setGreenRoomQuestion(null)
      expect(useAudienceStore.getState().greenRoomQuestion).toBeNull()
    })
  })

  describe('chaosCooldown', () => {
    it('enables cooldown', () => {
      useAudienceStore.getState().setChaosCooldown(true)
      expect(useAudienceStore.getState().chaosCooldown).toBe(true)
    })

    it('disables cooldown', () => {
      useAudienceStore.getState().setChaosCooldown(true)
      useAudienceStore.getState().setChaosCooldown(false)
      expect(useAudienceStore.getState().chaosCooldown).toBe(false)
    })
  })

  describe('reset', () => {
    it('restores all defaults', () => {
      useAudienceStore.getState().addMessage(makeMessage('1'))
      useAudienceStore.getState().addMessage(makeMessage('2'))
      useAudienceStore.getState().setGreenRoomQuestion('Some question')
      useAudienceStore.getState().setChaosCooldown(true)

      useAudienceStore.getState().reset()

      const state = useAudienceStore.getState()
      expect(state.spectatorMessages).toEqual([])
      expect(state.greenRoomQuestion).toBeNull()
      expect(state.chaosCooldown).toBe(false)
    })
  })
})
