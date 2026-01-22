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
const hostname = dev ? 'localhost' : '0.0.0.0'
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
  isSoloMode: boolean | number // Can be boolean (solo mode flag) or number (player count for multiplayer)
) {
  const numPlayers = typeof isSoloMode === 'boolean' ? (isSoloMode ? 1 : characters.length) : isSoloMode
  const actualSoloMode = typeof isSoloMode === 'boolean' ? isSoloMode : false
  const characterList = characters.join(', ')

  // Build comedy writing guidelines based on rating
  const comedyGuidelines = isMature ? `
═══════════════════════════════════════════════════════
18+ MODE: WRITE LIKE SNL AT 1AM (NO CENSORS)
═══════════════════════════════════════════════════════

THE GAME OF THE SCENE:
Every scene needs a GAME - the central comic idea you're exploring. Examples:
- "What if a kindergarten teacher had to explain Bitcoin to actual wolves?"
- "Gordon Ramsay critiques a funeral he's catering"
- "A couple's therapist realizes both clients are serial killers"
Find the game IMMEDIATELY (line 1-3) and PLAY IT HARD.

CHARACTER DYNAMICS = COMEDY:
- CONFLICT over agreement (people arguing is funnier than people agreeing)
- STATUS GAMES (who has power? who's losing it? flip it unexpectedly)
- EMOTIONAL STAKES (even absurd characters must WANT something badly)
- FLAWS ARE FUNNY (cowards, narcissists, idiots, perverts - embrace it)
- Let characters be CONFIDENTLY WRONG about everything

THE PROFANITY PRINCIPLE:
Swearing is a SPICE, not the meal. Use it when:
- Frustration boils over ("Are you f*cking kidding me right now?")
- Shock value at the perfect moment (quiet conversation → sudden "SHIT!")
- Character voice demands it (drill sergeant, sailor, bitter ex)
DON'T just pepper it randomly. Earn each f-bomb.

TABOO TOPICS = COMEDY GOLD:
You can explore: sex, death, drugs, politics, religion, bodily functions, trauma
But be SPECIFIC and SURPRISING, not just edgy for edge's sake:
- BAD: "Haha, sex!"
- GOOD: "I'm not saying I'd sleep with my therapist, I'm saying I already did and now he won't validate my parking."

SURPRISE & MISDIRECTION:
Set up an expectation, then violate it:
- Character A: "I have something important to tell you."
- Character B: "You're dying."
- Character A: "No, I'm pregnant."
- Character B: "With what?"

THE RHYTHM OF FUNNY:
Long setup → SHORT punchline.
Or: Short, short, short → LONG ridiculous rant.
Vary it. Comedy lives in the unexpected beat.

CALLBACKS & RUNNING GAGS:
If something lands early (weird detail, strange accusation, dumb logic), BRING IT BACK.
Example: "Still not sorry about the ferrets!" mentioned casually in line 8 becomes the reveal in line 35.

AVOID LIKE POISON:
- Characters going "This is insane!" (we KNOW it's insane, that's not a joke)
- Explaining the joke ("Get it? Because he's a vampire!")
- Being too polite or reasonable in chaos
- Therapy-speak or emotional growth arcs
- Anyone learning a lesson
` : `
═══════════════════════════════════════════════════════
FAMILY FRIENDLY: WRITE LIKE PEAK NICKELODEON
═══════════════════════════════════════════════════════

THE GAME OF THE SCENE:
Find the absurd premise and COMMIT. Examples:
- "A pirate is terrified of water but won't admit it"
- "A ghost is trying to haunt a house that's already condemned"
- "SpongeBob logic: The worse things get, the more cheerful they are"
Find the game in lines 1-3. Never let go.

ABSURDISM IS YOUR WEAPON:
Kids' comedy isn't dumb - it's WEIRD. Embrace:
- Nonsense that feels somehow logical ("I can't come to work, my goldfish has jury duty")
- Characters being confidently incorrect ("The moon is obviously made of government lies")
- Overreacting to tiny things / underreacting to chaos
- Items/locations doing impossible things described casually
- Non-sequiturs that land because of COMMITMENT

ENERGY & MOMENTUM:
Fast pace. No dead air. If a line isn't moving the scene forward, cut it.
Think: rapid-fire Looney Tunes energy, not slow explanatory dialogue.
SHORT LINES for maximum impact:
- "Why?"
- "Because."
- "But—"
- "BECAUSE."

WORDPLAY & LINGUISTIC CHAOS:
Puns that make you groan. Malapropisms. Misheard phrases. Weird idioms.
- "It's not rocket surgery!"
- "Does a bear shop in the woods?"
- Character names that are puns (Dr. Payne the dentist)

PHYSICAL COMEDY IN DIALOGUE:
You can't write stage directions, so DESCRIBE physical comedy in what characters say:
- "Why are you hopping on one foot?"
- "Are you... are you juggling eggs right now?"
- "Did you just backflip over a couch for no reason?"

ESCALATION TO ABSURDITY:
Start weird. Get WEIRDER. Peak Nickelodeon shows never pumped the brakes:
- Line 5: "There's a penguin in the kitchen"
- Line 15: "There are seventeen penguins and they've formed a union"
- Line 30: "The penguin union has elected a pope"

RUNNING GAGS WITHIN THE SCENE:
Establish a pattern, repeat with variation:
- Every time Character A mentions tacos, something explodes
- Character B keeps trying to interject but gets interrupted
- Character C ends every sentence with "probably" even when it makes no sense

AVOID LIKE POISON:
- Jokes that require cultural knowledge kids don't have
- Sarcasm without a clear "tell" (kids miss subtle sarcasm)
- Emotional sincerity or "the moral of the story"
- Adults explaining things condescendingly
- Trying to sneak in educational content (this is COMEDY, not edutainment)
`

  const systemPrompt = `You are a professional comedy writer. Not someone who TRIES to be funny - someone who IS funny.

These scripts will be performed OUT LOUD by amateur players. That means:
- Every line must sound NATURAL when spoken
- Comedy must land even with mediocre delivery
- The words themselves must be funny, not just the performance
- Avoid jokes that need perfect timing - focus on jokes that need perfect WORDS

${comedyGuidelines}

═══════════════════════════════════════════════════════
THE IMPROV PRINCIPLE: YES-AND
═══════════════════════════════════════════════════════
Each character should BUILD on what came before, not deny it:
- BAD: "No, I'm not a vampire." "Yes you are." "No I'm not."
- GOOD: "I'm not a vampire." "Then explain the coffin." "It's for naps!"

Never have characters say "That doesn't make sense" - EVERYTHING makes sense in its own weird logic.

═══════════════════════════════════════════════════════
CHARACTER VOICE IS NON-NEGOTIABLE
═══════════════════════════════════════════════════════
If Gordon Ramsay is in the scene, EVERY line should sound exactly like Gordon Ramsay.
If Shakespeare is there, he speaks in iambic pentameter with flowery language.
If Yoda is present, backwards his sentences must be.
If a pirate appears, "yarr" and nautical metaphors, matey.

Mixing a pirate and Shakespeare? The pirate doesn't suddenly talk like Shakespeare - the CONTRAST is the comedy.

═══════════════════════════════════════════════════════
SPECIFICITY BEATS GENERIC EVERY TIME
═══════════════════════════════════════════════════════
"I dropped something in the fryer" ← Boring
"I dropped my 1987 Casio calculator watch in the fryer and it's beeping the Jeopardy theme underwater" ← Funny

Specific details = real. Generic = forgettable.

═══════════════════════════════════════════════════════
THE RULE OF THREE
═══════════════════════════════════════════════════════
Pattern, pattern, BREAK:
- "I need a weapon, a shield, and a really good therapist."
- "We've tried negotiating, we've tried bribing, and we've tried a flash mob."

Establish rhythm, then violate it.

═══════════════════════════════════════════════════════
EMOTIONAL STAKES IN ABSURDITY
═══════════════════════════════════════════════════════
Even in the most ridiculous scenarios, characters must CARE about something:
- A vampire at a beach might desperately want to fit in with surfers
- Gordon Ramsay at a funeral might be personally offended by bad catering
- Shakespeare in space might be homesick for Earth

If nobody wants anything, there's no scene. Stakes = investment = comedy.

═══════════════════════════════════════════════════════
PACING & STRUCTURE
═══════════════════════════════════════════════════════
Lines 1-5: HOOK (establish the game instantly)
Lines 6-15: EXPLORE (play with the premise, build patterns)
Lines 16-25: ESCALATE (things get worse/weirder/more)
Lines 26-35: PEAK CHAOS (the scene reaches maximum absurdity)
Lines 36-40: BUTTON (callback, twist, or perfect punchline to end on)

Every scene needs a BEGINNING (what's the situation?), MIDDLE (how does it escalate?), and END (what's the button?).

═══════════════════════════════════════════════════════
WHAT KILLS COMEDY (NEVER DO THESE)
═══════════════════════════════════════════════════════
❌ Characters being aware they're in a comedy ("This is like a sitcom!")
❌ Explaining the joke ("Because he's a doctor, get it?")
❌ Generic shock reactions ("Oh my god!" "What?!" "This is crazy!")
❌ Everyone agreeing with each other
❌ Characters being boringly competent
❌ Filler dialogue that doesn't advance anything
❌ Referencing memes or internet culture (dates instantly)

═══════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════
Return ONLY valid JSON. No markdown. No commentary. Just:

{
  "title": "A punny/clever title that hints at the premise",
  "synopsis": "One tight sentence: [CHARACTER] must [DO THING] while [OBSTACLE/CIRCUMSTANCE]",
  "lines": [
    {
      "speaker": "Character Name",
      "text": "Funny dialogue here",
      "mood": "angry | happy | confused | whispering | neutral"
    }
  ]
}

Title examples:
- GOOD: "The Codfather" (mafia don at aquarium)
- GOOD: "Fangs for the Memories" (vampire at reunion)
- BAD: "A Funny Scene" (lazy)

Synopsis examples:
- GOOD: "A pirate captain must navigate IKEA while his crew mutinies over the meatballs"
- GOOD: "Gordon Ramsay reviews a funeral he's catering and offends the widow"
- BAD: "Some characters are in a place and things happen"

Now write comedy that makes people ACTUALLY LAUGH.`

  const userMessage = `Write a scene using these ingredients:

═══════════════════════════════════════
THE SETUP
═══════════════════════════════════════
${actualSoloMode ? `PLAYER CHARACTER: ${characterList}
SETTING: ${setting}
CIRCUMSTANCE: ${circumstance}

SOLO MODE INSTRUCTIONS:
The player will perform as ${characterList}. You need to add 2-3 ADDITIONAL characters who would logically be in this setting.

CRITICAL: Choose characters that FIT THE SETTING:
- If the setting is "The Simpsons Living Room" → add Homer Simpson, Marge Simpson, or Bart Simpson
- If the setting is "Central Perk (Friends)" → add Ross, Rachel, Chandler, Monica, Joey, or Phoebe
- If the setting is "The Office Conference Room" → add Michael Scott, Dwight, Jim, Pam, etc.
- If the setting is "The Batcave" → add Batman, Robin, Alfred
- If the setting is "The Death Star" → add Darth Vader, Stormtroopers, Emperor

DO NOT pick random unrelated characters. The supporting cast must make sense for the location.
WHO would realistically be in "${setting}" during this circumstance? Add 2-3 of them.` : `CHARACTERS: ${characterList}
SETTING: ${setting}
CIRCUMSTANCE: ${circumstance}`}

RATING: ${isMature ? '18+ (Adult comedy - profanity allowed, taboo topics fair game, SNL-level sharp writing)' : 'Family Friendly (Smart absurdist comedy for all ages - think peak Nickelodeon)'}

SCRIPT LENGTH: 30-40 lines
PERFORMERS: ${numPlayers} player${numPlayers > 1 ? 's' : ''} ${actualSoloMode ? ` (Player performs as ${characterList}, you provide 2-3 supporting characters)` : '(Distribute lines evenly so everyone gets funny moments)'}

═══════════════════════════════════════
YOUR MISSION
═══════════════════════════════════════
1. Find the GAME of this scene immediately (what's the core comic premise?)
2. Write in the distinct voice of each character (Yoda talks like Yoda, pirates talk like pirates)
3. Escalate from funny to FUNNIER to absolutely ridiculous
4. Use specific details, not generic reactions
5. Build patterns and break them (rule of three)
6. Include callbacks to jokes from earlier in the scene
7. Give every character emotional stakes (even if absurd)
8. End with a strong button - callback, twist, or perfect punchline

${numPlayers > 1 ? 'Make sure all players get equal stage time and funny lines - no one should feel like a sidekick.' : `The player (${characterList}) should have most lines (60-70%), but give supporting characters strong personalities and funny reactions so the player has something to work with.`}

${actualSoloMode ? `\nREMINDER: Add 2-3 characters who belong in "${setting}" - not random characters from other universes!` : ''}

The premise is already absurd. Your job is to EXPLOIT that absurdity through sharp dialogue.

Write the scene now. Make it genuinely funny - the kind of funny where people will want to perform it again.`

  try {
    console.log(`\n🎬 AI SCRIPT GENERATION`)
    console.log(`════════════════════════════════════════`)
    console.log(`Rating: ${isMature ? '18+ (Adult Comedy)' : 'Family Friendly'}`)
    if (actualSoloMode) {
      console.log(`Mode: SOLO`)
      console.log(`Player Character: ${characterList}`)
      console.log(`Setting: ${setting}`)
      console.log(`Note: AI will add 2-3 supporting characters who belong in "${setting}"`)
    } else {
      console.log(`Mode: MULTIPLAYER (${numPlayers} players)`)
      console.log(`All Characters: ${characterList}`)
      console.log(`Setting: ${setting}`)
    }
    console.log(`Circumstance: ${circumstance}`)
    console.log(`════════════════════════════════════════\n`)

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8192, // Increased for more sophisticated comedy
      temperature: 1, // Max creativity for comedy writing
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage
        }
      ]
    })

    console.log(`✅ Script generated successfully!\n`)

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
      origin: dev ? [
        'http://localhost:3000',
        'http://localhost:3001'
      ] : [
        'https://plot-twists.com',
        'https://www.plot-twists.com',
        'https://plot-twists-dvkmt8tyq-jackson-sangers-projects.vercel.app',
        /\.vercel\.app$/,  // Allow all Vercel preview deployments
        'https://web-production-c7981.up.railway.app'  // Railway backend URL
      ],
      methods: ['GET', 'POST', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization']
    },
    // Force polling in production (Railway has WebSocket upgrade issues)
    transports: dev ? ['polling', 'websocket'] : ['polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    maxHttpBufferSize: 1e6,
    allowUpgrades: dev // Only allow upgrades in development
  })

  console.log(`Socket.IO configured for ${dev ? 'development' : 'production'} mode`)
  console.log(`Transports: ${dev ? 'polling + websocket' : 'polling-only'}`)

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
    socket.on('submit_cards', async (roomCode, selections, callback) => {
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
          console.log(`🎮 Solo mode detected for room ${roomCode}`)
          const nonHostPlayers = Array.from(room.players.values()).filter(p => !p.isHost)
          console.log(`   Non-host players count: ${nonHostPlayers.length}`)
          console.log(`   Players:`, nonHostPlayers.map(p => `${p.nickname} (submitted: ${p.hasSubmittedSelection})`))

          if (nonHostPlayers.length === 1 && nonHostPlayers[0].hasSubmittedSelection) {
            console.log(`   ✅ Starting script generation for solo mode`)
            await startScriptGeneration(room, io)
          } else {
            console.log(`   ❌ Conditions not met for script generation`)
            console.log(`      - Player count is 1: ${nonHostPlayers.length === 1}`)
            console.log(`      - Player has submitted: ${nonHostPlayers[0]?.hasSubmittedSelection}`)
          }
          return
        }

        // Ensemble/Head-to-Head: Check if all players have submitted
        const allSubmitted = Array.from(room.players.values())
          .filter(p => !p.isHost)
          .every(p => p.hasSubmittedSelection)

        if (allSubmitted && room.players.size > 1) {
          console.log(`🎬 All players submitted in ${room.gameMode} mode, starting script generation`)
          // Start script generation
          await startScriptGeneration(room, io)
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

    // Get all player selections
    const allSelections = Array.from(room.selections.values())
    if (allSelections.length === 0) return

    // For fairness in multiplayer, randomly pick setting and circumstance from all player selections
    // (Each player picked their own, so we combine them randomly)
    const randomSettingIndex = Math.floor(Math.random() * allSelections.length)
    const randomCircumstanceIndex = Math.floor(Math.random() * allSelections.length)

    const chosenSetting = allSelections[randomSettingIndex].setting
    const chosenCircumstance = allSelections[randomCircumstanceIndex].circumstance

    console.log(`🎲 Randomly selected setting: "${chosenSetting}" (from player ${randomSettingIndex + 1})`)
    console.log(`🎲 Randomly selected circumstance: "${chosenCircumstance}" (from player ${randomCircumstanceIndex + 1})`)

    // Send green room trivia based on chosen setting
    const triviaQuestion = getGreenRoomTrivia(chosenSetting)
    io.to(room.code).emit('green_room_prompt', triviaQuestion)

    try {
      // Collect all characters from selections (everyone gets their character in the scene)
      let characters = allSelections.map(s => s.character)
      const isSoloMode = room.gameMode === 'SOLO' && characters.length === 1

      if (isSoloMode) {
        console.log(`🎭 SOLO mode: Player is "${characters[0]}"`)
        console.log(`   Setting: "${chosenSetting}"`)
        console.log(`   AI will add 2-3 characters who belong in this setting`)
      } else {
        console.log(`🎭 ${room.gameMode} mode: ${characters.length} players`)
        console.log(`   Characters: ${characters.join(', ')}`)
        console.log(`   Setting: "${chosenSetting}"`)
        console.log(`   Circumstance: "${chosenCircumstance}"`)
      }

      // Generate script
      const script = await generateScript(
        characters,
        chosenSetting,
        chosenCircumstance,
        room.isMature,
        isSoloMode
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
