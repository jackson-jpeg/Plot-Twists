import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { LoadingSpinner } from './LoadingSpinner';
import { analytics } from '../server/utils/analytics';

interface BookRecommendation {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  description: string;
  rating: number;
  imageUrl?: string;
  tags: string[];
  links?: {
    amazon?: string;
  };
}

interface BookRecommendationsWidgetProps {
  userId?: string;
  maxRecommendations?: number;
  onBookClick?: (bookId: string) => void;
}

export function BookRecommendationsWidget({ 
  userId, 
  maxRecommendations = 3,
  onBookClick 
}: BookRecommendationsWidgetProps) {
  const [recommendations, setRecommendations] = useState<BookRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [abTest] = useState(Math.random() < 0.5); // 50% for A/B testing

  useEffect(() => {
    fetchRecommendations();
    // Track widget view for A/B testing
    analytics.track('widget_view', {
      component: 'book_recommendations',
      ab_test: abTest ? 'enabled' : 'control',
      user_id: userId
    });
  }, [maxRecommendations, abTest]);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch(`/api/recommendations?limit=${maxRecommendations}`, {
        headers: {
          'x-api-key': 'public'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      
      const data = await response.json();
      setRecommendations(data.recommendations);
    } catch (err) {
      setError('Unable to load recommendations');
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookClick = async (book: BookRecommendation, isAffiliate: boolean = false) => {
    const clickData = {
      book_id: book.id,
      book_title: book.title,
      book_author: book.author,
      affiliate_click: isAffiliate,
      source: 'plot-twists-litdocket',
      user_id: userId,
      ab_test: abTest ? 'enabled' : 'control'
    };
    
    try {
      // Track click for analytics
      analytics.track('book_click', clickData);
      
      // Send to backend for deeper tracking
      await fetch(`/api/recommendations/${book.id}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      onBookClick?.(book.id);
      
      // Open affiliate link if available
      if (isAffiliate && book.links?.amazon) {
        window.open(book.links.amazon, '_blank');
      }
    } catch (err) {
      console.error('Error tracking click:', err);
    }
  };

  if (!abTest) {
    // Return empty for control group in A/B test
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recommended Reading
        </h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex space-x-3">
              <div className="w-16 h-24 bg-gray-200 animate-pulse rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-yellow-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Recommended Reading
        </h3>
        <p className="text-sm text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg p-6 shadow-sm border"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Recommended Reading
        </h3>
        <span className="text-xs text-gray-500">Powered by Plot-Twists</span>
      </div>

      <div className="space-y-4">
        {recommendations.map((book) => (
          <motion.div
            key={book.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group cursor-pointer"
            onClick={() => handleBookClick(book, !!book.links?.amazon)}
          >
            <div className="flex space-x-3">
              {book.imageUrl && (
                <div className="relative w-16 h-24 flex-shrink-0">
                  <Image
                    src={book.imageUrl}
                    alt={book.title}
                    fill
                    className="rounded object-cover"
                    sizes="64px"
                  />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                  {book.title}
                </h4>
                <p className="text-sm text-gray-600">by {book.author}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {book.description}
                </p>
                
                <div className="flex items-center mt-2 space-x-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-3 h-3 ${i < Math.floor(book.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="ml-1 text-xs text-gray-500">
                      {book.rating.toFixed(1)}
                    </span>
                  </div>
                  
                  {book.links?.amazon && (
                    <span className="text-xs text-blue-600 group-hover:text-blue-700">
                      Buy on Amazon →
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          From our legal reading collection at Plot-Twists
        </p>
      </div>
    </motion.div>
  );
}
