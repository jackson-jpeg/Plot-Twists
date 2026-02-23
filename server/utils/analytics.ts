// Simple analytics utility for cross-product tracking
interface AnalyticsEvent {
  eventName: string;
  properties: Record<string, any>;
  timestamp: number;
}

export const analytics = {
  track: (eventName: string, properties: Record<string, any> = {}) => {
    try {
      const event: AnalyticsEvent = {
        eventName,
        properties,
        timestamp: Date.now()
      };

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics]', event);
      }

      // Send to analytics service when connected
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', eventName, {
          ...properties,
          custom_event: true
        });
      }
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }
};
