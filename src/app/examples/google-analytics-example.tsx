'use client';

import { GoogleAnalytics, sendGAEvent } from '@next/third-parties/google';

// This is an example component that shows how to implement Google Analytics
// You would add the <GoogleAnalytics /> component to your layout.tsx
// And use the sendGAEvent function to track custom events

export default function GoogleAnalyticsExample() {
  // Replace 'G-XXXXXXXXXX' with your actual Google Analytics measurement ID
  return (
    <div className="p-4 border rounded">
      <h2 className="text-xl font-bold mb-4">Google Analytics Example</h2>
      <p className="mb-4">
        This is an example of how to implement Google Analytics using @next/third-parties.
        The GoogleAnalytics component should be added to your layout.tsx file.
      </p>
      
      {/* Add this to your layout.tsx */}
      <div className="bg-gray-100 p-2 rounded mb-4">
        <code className="text-sm">
          {'<GoogleAnalytics gaId="G-XXXXXXXXXX" />'}
        </code>
      </div>
      
      <p className="mb-4">
        You can track custom events using the sendGAEvent function:
      </p>
      
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={() => {
          sendGAEvent('event', 'button_clicked', {
            event_category: 'engagement',
            event_label: 'example_button',
            value: 1
          });
          alert('Event sent to Google Analytics!');
        }}
      >
        Track Event Example
      </button>
      
      {/* This would actually load Google Analytics - commented out for the example */}
      {/* <GoogleAnalytics gaId="G-XXXXXXXXXX" /> */}
    </div>
  );
} 