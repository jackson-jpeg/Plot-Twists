import express from 'express';
import { validateApiKey } from '../middleware/security';
import { recommendationService } from '../services/recommendation.service';

const router = express.Router();

// Public API endpoint for book recommendations
router.get('/recommendations', validateApiKey, (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 3, 5);
    const recommendations = recommendationService.getLegalRecommendations(limit);
    
    res.json({
      recommendations,
      source: 'plot-twists-litdocket-integration',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// Track recommendation clicks for analytics
router.post('/recommendations/:bookId/track', (req, res) => {
  const { bookId } = req.params;
  const { userId } = req.body;
  
  recommendationService.trackBookClick(bookId, userId);
  res.json({ success: true });
});

export default router;
