import { z } from 'zod';

const BookRecommendationSchema = z.object({
  id: z.string(),
  title: z.string(),
  author: z.string(),
  genre: z.string(),
  description: z.string(),
  coverUrl: z.string().optional(),
  plotSummary: z.string(),
  comedyPotential: z.string(),
  suggestedCharacters: z.array(z.string()),
  suggestedSettings: z.array(z.string()),
  audience: z.enum(['all', 'after-dark']),
  tags: z.array(z.string())
});

export type BookRecommendation = z.infer<typeof BookRecommendationSchema>;

class RecommendationService {
  private recommendations: BookRecommendation[] = [
    {
      id: 'to-kill-a-mockingbird',
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      genre: 'Legal Drama',
      description: 'A classic courtroom drama exploring racial injustice',
      coverUrl: '/covers/mockingbird.jpg',
      plotSummary: 'Young Scout Finch witnesses her father Atticus defend a wrongly accused Black man in 1930s Alabama',
      comedyPotential: 'Modernize the trial with TikTok evidence, Zoom court hearings, and a Gen Z jury',
      suggestedCharacters: ['Atticus Finch', 'Scout (as adult podcaster)', 'TikTok influencer witness'],
      suggestedSettings: ['Virtual courtroom', 'True crime podcast setup', 'Instagram live trial'],
      audience: 'after-dark',
      tags: ['legal', 'courtroom', 'social-justice', 'modern-twist']
    },
    {
      id: 'the-firm',
      title: 'The Firm',
      author: 'John Grisham',
      genre: 'Legal Thriller',
      description: 'A Harvard lawyer joins a Memphis firm that might be a front for organized crime',
      coverUrl: '/covers/firm.jpg',
      plotSummary: 'Mitch McDeere discovers his prestigious law firm has mafia ties and must cooperate with the FBI',
      comedyPotential: 'Law firm realizes they accidentally helped a crypto scam, now owe millions in NFT attorney fees',
      suggestedCharacters: ['Overwhelmed junior associate', 'Crypto bro client', 'Boomer partner who doesn\'t get blockchain'],
      suggestedSettings: ['Zoom deposition disaster', 'Instagram apology video', 'LinkedIn meltdown'],
      audience: 'all',
      tags: ['thriller', 'law-firm', 'crypto', 'generational-humor']
    },
    {
      id: 'my-cousin-vinny',
      title: 'My Cousin Vinny',
      author: 'Screenplay by Dale Launer',
      genre: 'Legal Comedy',
      description: 'A street-smart New Yorker defends his cousin in an Alabama murder trial',
      coverUrl: '/covers/vinny.jpg',
      plotSummary: 'Vinny Gambini uses unconventional methods to win his first case while annoying the judge',
      comedyPotential: 'Vinny discovers the legal system now accepts TikTok views as character evidence',
      suggestedCharacters: ['Vinny (updated for 2024)', 'Judge with anti-TikTok bias', 'Gen Z expert witness'],
      suggestedSettings: ['Small-town Alabama court', 'True crime doc filming', 'Social media influencer trial'],
      audience: 'all',
      tags: ['comedy', 'courtroom', 'fish-out-of-water', 'social-media']
    },
    {
      id: 'breakfast-club',
      title: 'The Breakfast Club',
      author: 'John Hughes',
      genre: 'Coming-of-Age',
      description: 'Five high school stereotypes discover common ground in Saturday detention',
      coverUrl: '/covers/breakfast-club.jpg',
      plotSummary: 'A brain, an athlete, a basket case, a princess, and a criminal bond over shared teenage struggles',
      comedyPotential: '30-year high school reunion detention - now they\'re all divorced professionals with burnout',
      suggestedCharacters: ['Former prom queen MLM consultant', 'Tech bro former jock', 'Cringe LinkedIn influencer'],
      suggestedSettings: ['Zoom detention (COVID throwback)', 'Corporate team-building weekend', 'Adult summer camp'],
      audience: 'after-dark',
      tags: ['reunion', 'millennial-angst', 'career-burnout', 'nostalgia']
    },
    {
      id: 'gone-girl',
      title: 'Gone Girl',
      author: 'Gillian Flynn',
      genre: 'Psychological Thriller',
      description: 'A man becomes the prime suspect when his wife disappears',
      coverUrl: '/covers/gone-girl.jpg',
      plotSummary: 'Nick Dunne faces media scrutiny and police suspicion as evidence suggests he murdered his missing wife',
      comedyPotential: 'The investigation gets derailed by true-crime TikTok detectives who keep getting details wrong',
      suggestedCharacters: ['Podcast-obsessed neighbor', 'Reddit detective', 'Couple seeking Netflix deal'],
      suggestedSettings: ['True crime podcast studio', 'Instagram live police press conference', 'Netflix documentary filming'],
      audience: 'after-dark',
      tags: ['true-crime', 'social-media', 'podcast', 'media-satire']
    }
  ];

  async getRecommendations(params?: { audience?: 'all' | 'after-dark'; limit?: number; tags?: string[] }): Promise<BookRecommendation[]> {
    let filtered = this.recommendations;
    
    if (params?.audience) {
      filtered = filtered.filter(r => r.audience === 'all' || r.audience === params.audience);
    }
    
    if (params?.tags?.length) {
      filtered = filtered.filter(r => 
        params.tags!.some(tag => r.tags.includes(tag))
      );
    }
    
    return filtered.slice(0, params?.limit || 5);
  }

  async getRecommendationById(id: string): Promise<BookRecommendation | null> {
    return this.recommendations.find(r => r.id === id) || null;
  }

  async getRandomRecommendation(audience?: 'all' | 'after-dark'): Promise<BookRecommendation | null> {
    const all = await this.getRecommendations({ audience });
    if (!all.length) return null;
    return all[Math.floor(Math.random() * all.length)];
  }
}

export const recommendationService = new RecommendationService();
