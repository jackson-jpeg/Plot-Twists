import React from 'react';
import { BookRecommendationsWidget } from './BookRecommendationsWidget';
import { useRoom } from '@/contexts/GameContext';

export const GameHistory = () => {
  const { roomData } = useRoom();
  
  const handleUseIdea = (characters: string[], settings: string[]) => {
    // Emit to room to suggest these cards
    console.log('Using ideas:', characters, settings);
    // This would integrate with game selection flow
  };

  return (
    <>
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Game History
        </h1>
        
        {/* Existing game history content */}
        
        <BookRecommendationsWidget 
          gameMode={roomData?.settings?.afterDark ? 'after-dark' : 'family'}
          onUseIdea={handleUseIdea}
        />
      </div>
    </>
  );
};
