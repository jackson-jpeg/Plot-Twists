# Plot Twists 🎭

An AI-powered Jackbox-style party game where players create and perform hilarious comedy scripts by mashing up famous characters with unlikely TV/Movie settings.

## Features

- **Real-time Multiplayer**: Host on TV/desktop, players use phones as controllers
- **AI-Generated Scripts**: Powered by Claude 3.5 Sonnet for creative, character-accurate comedy
- **Content Filtering**: Family Friendly or After Dark (R-Rated) modes
- **Multiple Game Modes**: Solo, Head-to-Head, and Ensemble performances
- **Synchronized Teleprompter**: Auto-scrolling script on TV, synced line-by-line to phones
- **Interactive Waiting**: "Green Room" trivia during AI generation
- **Voting System**: Audience votes for MVP performances

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Custom Node.js server with Express
- **Real-time**: Socket.io for WebSocket communication
- **AI**: Anthropic Claude API
- **UI/UX**: Framer Motion for animations
- **Deployment**: Railway (or any persistent Node.js hosting)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Anthropic API key ([Get one here](https://console.anthropic.com/))

### Installation

1. Clone the repository:
```bash
cd plot-twists
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Add your Anthropic API key to `.env`:
```env
ANTHROPIC_API_KEY=your_actual_api_key_here
```

### Running Locally

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

- **Host Screen**: Navigate to `/host` on your desktop/TV browser
- **Player Screens**: Players visit `/join` on their phones (or scan the QR code)

## How to Play

1. **Host Creates Room**: Visit `/host` to automatically create a game room
2. **Players Join**: Scan QR code or enter room code at `/join`
3. **Select Cards**: Each player picks a Character, Setting, and Circumstance
4. **AI Generates Script**: Claude writes a custom comedy script (10-20 seconds)
5. **Perform**: Players read their lines using phones as teleprompters
6. **Vote**: Everyone votes for the best performance
7. **Results**: MVP is crowned!

## Game Modes

- **Solo**: Single player monologue
- **Head-to-Head**: Two players compete (with audience voting)
- **Ensemble**: 3-6 players collaborate on a scene

## Architecture

### Room Management
- In-memory room storage (use Redis for production scale)
- 4-letter room codes (A-Z, 2-9, excluding confusing characters)
- Auto-cleanup of inactive rooms after 1 hour

### AI Integration
- System prompt enforces JSON structure
- Character-specific voice emulation (e.g., Yoda syntax)
- Tone adaptation (Family Friendly vs R-Rated)
- 30-40 line scripts (~3 minutes)

### Teleprompter Sync
- Host view: Auto-scrolling full script
- Client view: Current line (large) + next line (preview)
- Server-side timing based on 120 WPM average

## Deployment

### Railway (Recommended)

1. Create a new project on [Railway](https://railway.app/)
2. Connect your GitHub repository
3. Add environment variable: `ANTHROPIC_API_KEY`
4. Deploy!

Railway allows persistent WebSocket connections, unlike Vercel's serverless functions.

### Environment Variables

```env
ANTHROPIC_API_KEY=your_api_key_here
PORT=3000  # Optional, Railway sets this automatically
NODE_ENV=production
```

## Content Management

Edit character, setting, and circumstance lists in `/lib/content.ts`:

```typescript
export const CONTENT = {
  characters: {
    safe: [...],
    mature: [...]
  },
  settings: {
    safe: [...],
    mature: [...]
  },
  circumstances: {
    safe: [...],
    mature: [...]
  }
}
```

**Important**: Settings must be TV or Movie locations only!

## Security Features

- Input sanitization (max 50 chars, HTML tag removal)
- Rate limiting ready (add middleware as needed)
- Automatic room cleanup
- Host disconnect closes room

## Future Enhancements

- [ ] Persistent storage (Supabase) for "Hall of Fame" scripts
- [ ] Custom character/setting submissions
- [ ] Multiple language support
- [ ] Audio effects and background music
- [ ] Mobile haptic feedback on line changes
- [ ] Spectator mode with emoji reactions
- [ ] Tournament mode with brackets

## Troubleshooting

**WebSocket connection fails:**
- Ensure you're using Railway or similar (not Vercel)
- Check firewall settings
- Verify port 3000 is available

**AI generation is slow:**
- Normal! Claude typically takes 10-20 seconds
- Green Room trivia masks the wait time

**Players can't join:**
- Verify room code is correct (case-insensitive)
- Check that host hasn't disconnected
- Ensure socket.io is properly connected

## License

ISC

## Credits

- Powered by [Anthropic Claude](https://www.anthropic.com/)
- Inspired by Jackbox Games
- Built with ❤️ by the Plot Twists team

---

**Need help?** Check the issues tab or open a new issue!
