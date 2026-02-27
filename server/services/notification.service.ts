import { sendPushToRoom } from './push.service'
import { logger } from '../../lib/logger'
import type { Room } from '../../lib/types'

/** Get UIDs for all non-host players in a room */
function getPlayerUids(room: Room): string[] {
  return [...room.players.values()]
    .filter(p => p.uid && !p.isHost)
    .map(p => p.uid!)
}

/** Notify all non-host players in a room that the game is starting */
export async function notifyGameStarting(room: Room): Promise<void> {
  const playerUids = getPlayerUids(room)
  if (playerUids.length === 0) return

  await sendPushToRoom(
    room.code,
    'Showtime!',
    `The game in room ${room.code} is starting!`,
    playerUids
  ).catch(err => logger.error('[Notifications] notifyGameStarting failed:', err))
}

/** Notify players that voting is open */
export async function notifyVotingOpen(room: Room): Promise<void> {
  const playerUids = getPlayerUids(room)
  if (playerUids.length === 0) return

  await sendPushToRoom(
    room.code,
    'Vote for MVP!',
    'Who stole the show? Cast your vote now.',
    playerUids
  ).catch(err => logger.error('[Notifications] notifyVotingOpen failed:', err))
}
