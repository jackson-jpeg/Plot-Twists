import express from 'express';
import { recommendationService } from '../services/recommendation.service';

const router = express.Router();

// Add recommendation routes
router.get('/recommendations', async (req, res) => {
  try {
    const { audience, limit, tags } = req.query;
    const recommendations = await recommendationService.getRecommendations({
      audience: audience as any,
      limit: limit ? parseInt(limit as string) : undefined,
      tags: tags ? (tags as string).split(',') : undefined
    });
    res.json(recommendations);
  } catch (error) {
    console.error('Failed to fetch recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

export default router;
