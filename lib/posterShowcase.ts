export interface PosterPalette {
  background: string
  accent: string
  edge: string
  glow: string
  text: string
}

export interface PosterShowcaseItem {
  id: string
  title: string
  crossover: string
  logline: string
  tone: string
  badges: string[]
  ctaLabel: string
  palette: PosterPalette
}

export const posterShowcaseItems: PosterShowcaseItem[] = [
  {
    id: 'shrek-seinfeld',
    title: 'Shrek in Seinfeld',
    crossover: 'Swamp drama meets apartment-level pettiness',
    logline: 'An ogre, a talking donkey, and the most judgmental friend group in Manhattan all end up in the same cursed dinner scene.',
    tone: 'Petty, iconic, impossible to stop quoting',
    badges: ['Fan Favorite', 'Apartment Chaos', 'Fast Banter'],
    ctaLabel: 'Host a mashup',
    palette: {
      background: 'linear-gradient(180deg, #24411d 0%, #151f0d 52%, #08110f 100%)',
      accent: '#d4ff59',
      edge: '#8ac926',
      glow: 'rgba(183, 255, 94, 0.34)',
      text: '#f8ffe8',
    },
  },
  {
    id: 'mcqueen-sopranos',
    title: 'Lightning McQueen in The Sopranos',
    crossover: 'Family business, but make it NASCAR',
    logline: 'A hotshot race car gets pulled into a tense suburban sit-down where every compliment sounds vaguely threatening.',
    tone: 'High-octane mob comedy with too much ego',
    badges: ['Crowd Pleaser', 'Fast Talk', 'Wheel Drama'],
    ctaLabel: 'Join the cast',
    palette: {
      background: 'linear-gradient(180deg, #6a1111 0%, #2d0d0e 48%, #0f0d12 100%)',
      accent: '#ff7a32',
      edge: '#ffbf69',
      glow: 'rgba(255, 122, 50, 0.32)',
      text: '#fff4eb',
    },
  },
  {
    id: 'ned-hannah',
    title: 'Ned Stark in Hannah Montana',
    crossover: 'Winter is coming to the school talent show',
    logline: 'A doomed northern lord tries to survive teen pop secrets, backstage drama, and one aggressively upbeat costume change.',
    tone: 'Prestige fantasy with glitter and betrayal',
    badges: ['Plot Twist', 'Backstage Betrayal', 'Big Reveal'],
    ctaLabel: 'See it live',
    palette: {
      background: 'linear-gradient(180deg, #2a254d 0%, #17192f 50%, #120b16 100%)',
      accent: '#ff7edb',
      edge: '#c3b0ff',
      glow: 'rgba(255, 126, 219, 0.3)',
      text: '#fff1fe',
    },
  },
  {
    id: 'barbie-bear',
    title: 'Barbie in The Bear',
    crossover: 'Dreamhouse optimism enters a panic kitchen',
    logline: 'A relentlessly polished icon takes over a barely functioning restaurant and starts giving motivational speeches during service.',
    tone: 'Hot pink pressure cooker energy',
    badges: ['New', 'Kitchen Panic', 'Chaos Ensemble'],
    ctaLabel: 'Build your scene',
    palette: {
      background: 'linear-gradient(180deg, #ff4f8f 0%, #7c1234 52%, #20070e 100%)',
      accent: '#ffd166',
      edge: '#ffe8a3',
      glow: 'rgba(255, 209, 102, 0.28)',
      text: '#fff8fb',
    },
  },
]
