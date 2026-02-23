import { BookRecommendation } from '../db/types';

interface LegalGenreBook {
  title: string;
  subtitle?: string;
  author: string;
  imageUrl?: string;
  description: string;
  genre: 'legal-thriller' | 'courtroom-drama' | 'law-mystery' | 'biography';
  rating: number;
  year: number;
  affiliateLink?: string;
  isbn?: string;
}

class RecommendationService {
  private legalBooks: LegalGenreBook[] = [
    {
      title: "Presumed Innocent",
      subtitle: "A Novel",
      author: "Scott Turow",
      genre: "legal-thriller",
      rating: 4.5,
      year: 1987,
      description: "A gripping legal thriller about prosecutor Rusty Sabich accused of murdering his colleague and former lover.",
      imageUrl: "https://images-na.ssl-images-amazon.com/images/I/81vSQR5QwxL.jpg",
      affiliateLink: "https://www.amazon.com/dp/0446571196"
    },
    {
      title: "A Time to Kill",
      author: "John Grisham",
      genre: "courtroom-drama",
      rating: 4.6,
      year: 1989,
      description: "A brutal rape case leads to vigilante justice and an explosive trial in a deep South town.",
      imageUrl: "https://images-na.ssl-images-amazon.com/images/I/81F30RfhV+L.jpg",
      affiliateLink: "https://www.amazon.com/dp/0385339609"
    },
    {
      title: "The Lincoln Lawyer",
      author: "Michael Connelly",
      genre: "law-mystery",
      rating: 4.4,
      year: 2005,
      description: "Criminal defense attorney Mickey Haller works out of his Lincoln Town Car, taking cases across LA.",
      imageUrl: "https://images-na.ssl-images-amazon.com/images/I/71Q1t4-rAOL.jpg",
      affiliateLink: "https://www.amazon.com/dp/0446699575"
    },
    {
      title: "My Beloved World",
      author: "Sonia Sotomayor",
      genre: "biography",
      rating: 4.7,
      year: 2013,
      description: "Supreme Court Justice Sonia Sotomayor's powerful memoir of her journey from the Bronx to the federal bench.",
      imageUrl: "https://images-na.ssl-images-amazon.com/images/I/81mD+2sT8UL.jpg",
      affiliateLink: "https://www.amazon.com/dp/034580483X"
    },
    {
      title: "The Firm",
      author: "John Grisham",
      genre: "legal-thriller",
      rating: 4.5,
      year: 1991,
      description: "A young law graduate discovers his new Memphis firm is laundering money for the mob.",
      imageUrl: "https://images-na.ssl-images-amazon.com/images/I/91BCs4TpXEL.jpg",
      affiliateLink: "https://www.amazon.com/dp/0385319055"
    }
  ];

  getLegalRecommendations(limit: number = 3): BookRecommendation[] {
    // Return a mix of popular and recent legal-themed books
    const shuffled = [...this.legalBooks].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, limit).map(book => ({
      id: `legal-${book.title.toLowerCase().replace(/\s+/g, '-')}-${book.year}`,
      title: book.title,
      subtitle: book.subtitle,
      author: book.author,
      description: book.description,
      rating: book.rating,
      imageUrl: book.imageUrl,
      source: 'litdocket-cross-promo',
      tags: [book.genre],
      links: book.affiliateLink ? {
        amazon: book.affiliateLink
      } : undefined
    }));

    return selected;
  }

  // Track clicks for A/B testing
  trackBookClick(bookId: string, userId?: string) {
    // This will be implemented when analytics service is connected
    console.log(`Book click tracked: ${bookId} by ${userId || 'anonymous'}`);
  }
}

export const recommendationService = new RecommendationService();
