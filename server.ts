import 'dotenv/config'
import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server as SocketIOServer } from 'socket.io'
import express from 'express'
import type { ServerToClientEvents, ClientToServerEvents, Room, Player, CardSelection, RoomSettings } from './lib/types'
import { getFilteredContent, getGreenRoomQuestion } from './lib/content'
import { v4 as uuidv4 } from 'uuid'
import Anthropic from '@anthropic-ai/sdk'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// In-memory room storage
const rooms = new Map<string, Room>()

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

// Generate a unique 4-letter room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude confusing characters
  let code = ''
  do {
    code = ''
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
  } while (rooms.has(code))
  return code
}

// Sanitize user input
function sanitizeInput(input: string): string {
  return input.trim().slice(0, 50).replace(/[<>]/g, '')
}

// Clean up inactive rooms (runs every 5 minutes)
setInterval(() => {
  const now = Date.now()
  const oneHour = 60 * 60 * 1000
  for (const [code, room] of rooms.entries()) {
    if (now - room.lastActivity > oneHour) {
      console.log(`Cleaning up inactive room: ${code}`)
      rooms.delete(code)
    }
  }
}, 5 * 60 * 1000)

// Generate script using Claude
async function generateScript(
  characters: string[],
  setting: string,
  circumstance: string,
  isMature: boolean,
  numPlayers: number
) {
  const tone = isMature ? 'R-Rated (Adult humor, profanity allowed)' : 'Family Friendly (PG, wholesome)'
  const characterList = characters.join(', ')

  const systemPrompt = `You are a comedy scriptwriting engine for a party game called 'Plot Twists'.
Your goal is to write a funny, dialogue-heavy script based on specific character/setting mashups.

OUTPUT INSTRUCTIONS:
1. You must output ONLY valid JSON.
2. Do not include any conversational filler (no "Here is your script").
3. Do not use Markdown formatting (no \`\`\`json blocks).

JSON STRUCTURE:
{
  "title": "String (Funny Title)",
  "synopsis": "String (One sentence setup)",
  "lines": [
    {
      "speaker": "String (Character Name)",
      "text": "String (The dialogue line)",
      "mood": "String (angry | happy | confused | whispering | neutral)"
    }
  ]
}`

  const userMessage = `Generate a script with the following parameters:
- Characters: ${characterList}
- Setting: ${setting}
- Circumstance: ${circumstance}
- Tone: ${tone}
- Script Length: Approx 3 minutes (30-40 lines of dialogue)
- Number of players: ${numPlayers}

${numPlayers > 1 ? 'Distribute the lines evenly among all characters.' : ''}
Ensure the characters speak in their distinct voices (e.g., if Yoda is a character, use his syntax).`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage
        }
      ]
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Strip markdown code blocks if present
    let jsonText = content.text.trim()
    if (jsonText.startsWith('```')) {
      // Remove opening ```json or ```
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '')
      // Remove closing ```
      jsonText = jsonText.replace(/\n?```$/, '')
    }

    const script = JSON.parse(jsonText.trim())
    return script
  } catch (error) {
    console.error('Error generating script:', error)
    throw error
  }
}

// Get trivia question based on setting (uses content.ts GREEN_ROOM_QUESTIONS)
function getGreenRoomTrivia(setting: string): string {
  return getGreenRoomQuestion(setting)
}

app.prepare().then(() => {
  const expressApp = express()
  const server = createServer(expressApp)

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
      origin: dev ? 'http://localhost:3000' : '*',
      methods: ['GET', 'POST']
    }
  })

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // Create room
    socket.on('create_room', (settings, callback) => {
      try {
        const code = generateRoomCode()
        const hostPlayer: Player = {
          id: uuidv4(),
          nickname: 'Host',
          role: 'HOST',
          isHost: true,
          socketId: socket.id
        }

        const room: Room = {
          code,
          host: hostPlayer,
          players: new Map([[hostPlayer.id, hostPlayer]]),
          gameState: 'LOBBY',
          gameMode: settings.gameMode || 'ENSEMBLE',
          isMature: settings.isMature || false,
          selections: new Map(),
          currentLineIndex: 0,
          votes: new Map(),
          createdAt: Date.now(),
          lastActivity: Date.now()
        }

        rooms.set(code, room)
        socket.join(code)

        console.log(`Room created: ${code}`)
        callback({ success: true, code })
        socket.emit('room_created', code)
      } catch (error) {
        console.error('Error creating room:', error)
        callback({ success: false, error: 'Failed to create room' })
      }
    })

    // Join room
    socket.on('join_room', (roomCode, nickname, callback) => {
      try {
        const upperRoomCode = roomCode.toUpperCase()
        console.log(`Join attempt - Room: ${upperRoomCode}, Nickname: ${nickname}`)
        console.log(`Available rooms:`, Array.from(rooms.keys()))

        const room = rooms.get(upperRoomCode)
        if (!room) {
          console.log(`Room ${upperRoomCode} not found!`)
          callback({ success: false, error: 'Room not found' })
          return
        }

        // Check if game already started
        if (room.gameState !== 'LOBBY') {
          callback({ success: false, error: 'Game already in progress' })
          return
        }

        const sanitizedNickname = sanitizeInput(nickname)
        if (!sanitizedNickname) {
          console.log(`Invalid nickname: ${nickname}`)
          callback({ success: false, error: 'Invalid nickname' })
          return
        }

        // Check player limits based on game mode
        const currentPlayerCount = Array.from(room.players.values()).filter(p => !p.isHost).length
        const maxPlayers = room.gameMode === 'SOLO' ? 1 : room.gameMode === 'HEAD_TO_HEAD' ? 2 : 6

        if (currentPlayerCount >= maxPlayers) {
          callback({
            success: false,
            error: `Room is full (${maxPlayers} ${maxPlayers === 1 ? 'player' : 'players'} max for ${room.gameMode} mode)`
          })
          return
        }

        // Check for duplicate nicknames
        const nicknameExists = Array.from(room.players.values()).some(p =>
          p.nickname.toLowerCase() === sanitizedNickname.toLowerCase()
        )
        if (nicknameExists) {
          callback({ success: false, error: 'Nickname already taken in this room' })
          return
        }

        const player: Player = {
          id: uuidv4(),
          nickname: sanitizedNickname,
          role: 'PLAYER',
          isHost: false,
          socketId: socket.id,
          score: 0
        }

        room.players.set(player.id, player)
        room.lastActivity = Date.now()
        socket.join(upperRoomCode)

        const playersList = Array.from(room.players.values())
        io.to(upperRoomCode).emit('player_joined', player)
        io.to(upperRoomCode).emit('players_update', playersList)

        const roomSettings: RoomSettings = {
          isMature: room.isMature,
          gameMode: room.gameMode
        }

        console.log(`✓ Player "${sanitizedNickname}" (ID: ${player.id}) successfully joined room ${upperRoomCode}`)
        console.log(`Total players in room: ${playersList.length}`, playersList.map(p => p.nickname))

        callback({
          success: true,
          players: playersList,
          settings: roomSettings
        })
      } catch (error) {
        console.error('Error joining room:', error)
        callback({ success: false, error: 'Failed to join room' })
      }
    })

    // Submit card selections
    socket.on('submit_cards', (roomCode, selections, callback) => {
      try {
        const room = rooms.get(roomCode)
        if (!room) {
          callback({ success: false, error: 'Room not found' })
          return
        }

        // Find player by socket ID
        let playerId: string | undefined
        for (const [id, player] of room.players.entries()) {
          if (player.socketId === socket.id) {
            playerId = id
            break
          }
        }

        if (!playerId) {
          callback({ success: false, error: 'Player not found' })
          return
        }

        room.selections.set(playerId, selections)
        const player = room.players.get(playerId)
        if (player) {
          player.hasSubmittedSelection = true
        }
        room.lastActivity = Date.now()

        io.to(roomCode).emit('players_update', Array.from(room.players.values()))

        console.log(`Player ${playerId} submitted selections for room ${roomCode}`)
        callback({ success: true })

        // Solo mode: Start immediately when single player submits
        if (room.gameMode === 'SOLO') {
          const nonHostPlayers = Array.from(room.players.values()).filter(p => !p.isHost)
          if (nonHostPlayers.length === 1 && nonHostPlayers[0].hasSubmittedSelection) {
            startScriptGeneration(room, io)
          }
          return
        }

        // Ensemble/Head-to-Head: Check if all players have submitted
        const allSubmitted = Array.from(room.players.values())
          .filter(p => !p.isHost)
          .every(p => p.hasSubmittedSelection)

        if (allSubmitted && room.players.size > 1) {
          // Start script generation
          startScriptGeneration(room, io)
        }
      } catch (error) {
        console.error('Error submitting cards:', error)
        callback({ success: false, error: 'Failed to submit selections' })
      }
    })

    // Start game
    socket.on('start_game', (roomCode) => {
      const room = rooms.get(roomCode)
      if (!room) return

      room.gameState = 'SELECTION'
      room.lastActivity = Date.now()
      io.to(roomCode).emit('game_state_change', 'SELECTION')

      // Send available cards to all players
      const content = getFilteredContent(room.isMature)
      io.to(roomCode).emit('available_cards', content)
    })

    // Submit vote
    socket.on('submit_vote', (roomCode, targetPlayerId) => {
      const room = rooms.get(roomCode)
      if (!room) return

      // Find voter by socket ID
      let voterId: string | undefined
      for (const [id, player] of room.players.entries()) {
        if (player.socketId === socket.id) {
          voterId = id
          break
        }
      }

      if (!voterId) return

      room.votes.set(voterId, targetPlayerId)
      const voter = room.players.get(voterId)
      if (voter) {
        voter.hasSubmittedVote = true
      }
      room.lastActivity = Date.now()

      io.to(roomCode).emit('players_update', Array.from(room.players.values()))

      // Check if all players have voted
      const allVoted = Array.from(room.players.values())
        .filter(p => p.role === 'SPECTATOR' || p.role === 'PLAYER')
        .every(p => p.hasSubmittedVote)

      if (allVoted) {
        calculateResults(room, io)
      }
    })

    // Advance script line
    socket.on('advance_script_line', (roomCode) => {
      const room = rooms.get(roomCode)
      if (!room || !room.script) return

      room.currentLineIndex++
      room.lastActivity = Date.now()
      io.to(roomCode).emit('sync_teleprompter', room.currentLineIndex)
    })

    // Update room settings
    socket.on('update_room_settings', (roomCode, settings) => {
      const room = rooms.get(roomCode)
      if (!room) return

      if (settings.isMature !== undefined) {
        room.isMature = settings.isMature
      }
      if (settings.gameMode !== undefined) {
        room.gameMode = settings.gameMode
      }
      room.lastActivity = Date.now()

      const roomSettings: RoomSettings = {
        isMature: room.isMature,
        gameMode: room.gameMode
      }
      io.to(roomCode).emit('room_settings_update', roomSettings)
    })

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log('Client disconnected:', socket.id, 'Reason:', reason)

      // Give a grace period before removing players (helps with reconnections)
      setTimeout(() => {
        // Check if socket reconnected (if it's connected again, don't remove)
        const reconnected = io.sockets.sockets.get(socket.id)
        if (reconnected && reconnected.connected) {
          console.log('Socket reconnected, not removing player:', socket.id)
          return
        }

        // Find and remove player from rooms
        for (const [code, room] of rooms.entries()) {
          for (const [playerId, player] of room.players.entries()) {
            if (player.socketId === socket.id) {
              console.log(`Removing player ${player.nickname} from room ${code}`)
              room.players.delete(playerId)
              io.to(code).emit('player_left', playerId)
              io.to(code).emit('players_update', Array.from(room.players.values()))

              // If host left and room is still in lobby, allow others to continue
              // Only delete room if it's empty or has been too long
              if (player.isHost && room.gameState === 'LOBBY' && room.players.size === 0) {
                console.log(`Deleting empty room ${code}`)
                rooms.delete(code)
              } else if (player.isHost) {
                // Host left during game - notify but don't delete immediately
                io.to(code).emit('error', 'Host disconnected')
              }
              break
            }
          }
        }
      }, 3000) // 3 second grace period
    })
  })

  // Helper function to start script generation
  async function startScriptGeneration(room: Room, io: SocketIOServer) {
    room.gameState = 'LOADING'
    io.to(room.code).emit('game_state_change', 'LOADING')

    // Get first player's selection for setting
    const firstSelection = Array.from(room.selections.values())[0]
    if (!firstSelection) return

    // Send green room trivia
    const triviaQuestion = getGreenRoomTrivia(firstSelection.setting)
    io.to(room.code).emit('green_room_prompt', triviaQuestion)

    try {
      // Collect all characters from selections
      let characters = Array.from(room.selections.values()).map(s => s.character)

      // Solo mode: Add AI characters to fill the cast
      if (room.gameMode === 'SOLO' && characters.length === 1) {
        const content = getFilteredContent(room.isMature)
        // Get 2-3 additional random characters that aren't the player's character
        const availableCharacters = content.characters.filter(c => !characters.includes(c))
        const numAICharacters = 2 + Math.floor(Math.random() * 2) // 2-3 AI characters

        for (let i = 0; i < numAICharacters; i++) {
          const randomIndex = Math.floor(Math.random() * availableCharacters.length)
          characters.push(availableCharacters[randomIndex])
          availableCharacters.splice(randomIndex, 1) // Remove to avoid duplicates
        }

        console.log(`Solo mode: Generated AI characters for room ${room.code}:`, characters)
      }

      // Generate script
      const script = await generateScript(
        characters,
        firstSelection.setting,
        firstSelection.circumstance,
        room.isMature,
        characters.length
      )

      room.script = script
      room.gameState = 'PERFORMING'
      room.currentLineIndex = 0

      io.to(room.code).emit('script_ready', script)
      io.to(room.code).emit('game_state_change', 'PERFORMING')

      // Start teleprompter sync
      startTeleprompterSync(room, io)
    } catch (error) {
      console.error('Script generation failed:', error)
      io.to(room.code).emit('error', 'Failed to generate script. Please try again.')

      // Reset game state to SELECTION so players can try again
      room.gameState = 'SELECTION'
      room.selections.clear()

      // Reset all player submission flags
      for (const player of room.players.values()) {
        player.hasSubmittedSelection = false
      }

      io.to(room.code).emit('game_state_change', 'SELECTION')
      io.to(room.code).emit('players_update', Array.from(room.players.values()))

      // Send cards again
      const content = getFilteredContent(room.isMature)
      io.to(room.code).emit('available_cards', content)
    }
  }

  // Helper function for teleprompter sync
  function startTeleprompterSync(room: Room, io: SocketIOServer) {
    if (!room.script) return

    const WPM = 120 // Words per minute
    const totalWords = room.script.lines.reduce((acc, line) => {
      return acc + line.text.split(' ').length
    }, 0)
    const totalDurationMs = (totalWords / WPM) * 60 * 1000
    const intervalMs = totalDurationMs / room.script.lines.length

    const interval = setInterval(() => {
      if (!room.script || room.currentLineIndex >= room.script.lines.length - 1) {
        clearInterval(interval)
        // Move to voting or results
        if (room.gameMode === 'HEAD_TO_HEAD' || room.gameMode === 'ENSEMBLE') {
          room.gameState = 'VOTING'
          io.to(room.code).emit('game_state_change', 'VOTING')
        } else {
          room.gameState = 'RESULTS'
          io.to(room.code).emit('game_state_change', 'RESULTS')
        }
        return
      }

      room.currentLineIndex++
      io.to(room.code).emit('sync_teleprompter', room.currentLineIndex)
    }, intervalMs)
  }

  // Calculate voting results
  function calculateResults(room: Room, io: SocketIOServer) {
    const voteCounts = new Map<string, number>()

    for (const targetId of room.votes.values()) {
      voteCounts.set(targetId, (voteCounts.get(targetId) || 0) + 1)
    }

    const results = Array.from(voteCounts.entries())
      .map(([playerId, votes]) => ({
        playerId,
        playerName: room.players.get(playerId)?.nickname || 'Unknown',
        votes
      }))
      .sort((a, b) => b.votes - a.votes)

    const winner = results[0]

    room.gameState = 'RESULTS'
    io.to(room.code).emit('game_over', {
      winner,
      allResults: results
    })
    io.to(room.code).emit('game_state_change', 'RESULTS')
  }

  // Handle Next.js requests
  expressApp.use((req, res) => {
    const parsedUrl = parse(req.url!, true)
    return handle(req, res, parsedUrl)
  })

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
