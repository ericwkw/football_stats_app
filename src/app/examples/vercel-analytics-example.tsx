'use client';

import { useState } from 'react';
import va from '@vercel/analytics';

export default function VercelAnalyticsExample() {
  const [eventCount, setEventCount] = useState(0);

  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    va.track(eventName, properties);
    setEventCount(prev => prev + 1);
  };

  return (
    <div className="p-4 border rounded">
      <h2 className="text-xl font-bold mb-4">Vercel Analytics Custom Events Example</h2>
      
      <p className="mb-4">
        This example shows how to track custom events using Vercel Analytics.
        The events will only be tracked in production, not in development.
      </p>
      
      <div className="grid gap-4 grid-cols-2 mb-4">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => trackEvent('button_clicked', { button: 'primary', location: 'example' })}
        >
          Track Primary Button Click
        </button>
        
        <button
          className="bg-green-500 text-white px-4 py-2 rounded"
          onClick={() => trackEvent('button_clicked', { button: 'secondary', location: 'example' })}
        >
          Track Secondary Button Click
        </button>
        
        <button
          className="bg-yellow-500 text-white px-4 py-2 rounded"
          onClick={() => trackEvent('feature_used', { feature: 'stats_filter', value: 'goals' })}
        >
          Track Feature Usage
        </button>
        
        <button
          className="bg-purple-500 text-white px-4 py-2 rounded"
          onClick={() => trackEvent('user_preference', { theme: 'dark', notifications: 'enabled' })}
        >
          Track User Preference
        </button>
      </div>
      
      <div className="bg-gray-100 p-3 rounded">
        <p>Events triggered in this session: <strong>{eventCount}</strong></p>
        <p className="text-sm text-gray-600 mt-2">
          Note: Events are only sent in production. In development, 
          you'll see events logged to the console.
        </p>
      </div>
    </div>
  );
} 