import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronRight, X } from 'lucide-react';

interface BookRecommendation {
  id: string;
  title: string;
  author: string;
  genre: string;
  description: string;
  coverUrl?: string;
  plotSummary: string;
  comedyPotential: string;
  suggestedCharacters: string[];
  suggestedSettings: string[];
  audience: 'all' | 'after-dark';
  tags: string[];
}

interface BookRecommendationsWidgetProps {
  onUseIdea?: (characters: string[], settings: string[]) => void;
  gameMode?: 'family' | 'after-dark';
}

export const BookRecommendationsWidget: React.FC<BookRecommendationsWidgetProps> = ({ 
  onUseIdea,
  gameMode = 'family' 
}) => {
  const [recommendations, setRecommendations] = useState<BookRecommendation[]>([]);
  const [selectedBook, setSelectedBook] = useState<BookRecommendation | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, [gameMode]);

  const fetchRecommendations = async () => {
    try {
      const audience = gameMode === 'after-dark' ? 'after-dark' : 'all';
      const response = await fetch(`/api/recommendations?audience=${audience}&limit=3`);
      const data = await response.json();
      setRecommendations(data);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    }
  };

  const handleUseIdea = () => {
    if (!selectedBook || !onUseIdea) return;
    
    const randomCharacters = selectedBook.suggestedCharacters
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    const randomSettings = selectedBook.suggestedSettings
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    
    onUseIdea(randomCharacters, randomSettings);
    setIsExpanded(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <AnimatePresence>
        {!isExpanded && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, x: 100 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 100 }}
            onClick={() => setIsExpanded(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg"
          >
            <BookOpen size={20} />
            <span className="text-sm font-medium">Book Ideas</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-80 max-h-[500px] overflow-y-auto"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Story Inspirations
                </h3>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Legal & literary classics with comedic twists
              </p>
            </div>

            <div className="p-4 space-y-4">
              {recommendations.map((book) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:border-purple-600 transition-colors cursor-pointer"
                  onClick={() => setSelectedBook(book)}
                >
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                    {book.title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {book.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
                      {book.genre}
                    </span>
                    {book.audience === 'after-dark' && (
                      <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
                        After Dark
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {selectedBook && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-t border-gray-200 dark:border-gray-700 p-4"
              >
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">
                  {selectedBook.title}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  {selectedBook.comedyPotential}
                </p>
                
                {onUseIdea && (
                  <button
                    onClick={handleUseIdea}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm px-3 py-2 rounded flex items-center justify-center gap-1"
                  >
                    Use These Ideas
                    <ChevronRight size={16} />
                  </button>
                )}
                
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  Powered by Plot-Twists Literary Analysis
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
