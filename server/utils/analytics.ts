export const trackCrossPromotion = async (event: string, data: any) => {
  // Track cross-promotion events for litdocket integration
  console.log(`[CrossPromotion] ${event}:`, data);
  
  // Would integrate with analytics service (Vercel, GA4, etc.)
  if (process.env.VITE_VERCEL_ANALYTICS_ID) {
    // Send to analytics
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        properties: {
          ...data,
          source: 'plot-twists',
          target: 'litdocket',
          timestamp: Date.now()
        }
      })
    });
  }
};

export const CrossPromotionEvents = {
  LITDOCKET_WIDGET_VIEW: 'litdocket_widget_view',
  LITDOCKET_WIDGET_CLICK: 'litdocket_widget_click',
  LITDOCKET_BOOK_SELECTED: 'litdocket_book_selected',
  LITDOCKET_IDEA_USED: 'litdocket_idea_used'
} as const;
