# Analytics Setup for Football Stats App

This document explains the analytics options available for our Next.js 15.3.2 football stats application.

## Current Implementation: Vercel Analytics and Speed Insights

We've implemented two Vercel analytics solutions:

### 1. Vercel Analytics
Vercel Analytics is a lightweight, privacy-friendly analytics solution that provides basic page view tracking, traffic sources, and user demographics without compromising performance.

#### Key Benefits
- First-party analytics (no third-party cookies)
- Privacy-friendly (compliant with GDPR and other privacy regulations)
- 44x smaller than Google Analytics
- Simple implementation
- No impact on Core Web Vitals
- Available on all Vercel plans

#### Implementation Details
The implementation is in the root layout file (`src/app/layout.tsx`):

```tsx
import { Analytics } from '@vercel/analytics/react';

// In the layout component
<html>
  <body>
    {/* ... */}
    <Analytics />
  </body>
</html>
```

### 2. Vercel Speed Insights
Speed Insights provides detailed performance metrics based on Core Web Vitals, enabling data-driven decisions for optimizing site performance.

#### Key Benefits
- Monitors real user experience with Core Web Vitals metrics
- Helps identify performance bottlenecks
- Provides detailed dashboard with performance scores
- Shows performance by device type, country, and route
- Integrates seamlessly with Next.js

#### Implementation Details
The implementation is in the root layout file (`src/app/layout.tsx`):

```tsx
import { SpeedInsights } from '@vercel/speed-insights/next';

// In the layout component
<html>
  <body>
    {/* ... */}
    <SpeedInsights />
  </body>
</html>
```

## Alternative Option: Google Analytics via @next/third-parties

For more advanced analytics needs, we've also set up an example using Google Analytics through Next.js's `@next/third-parties` library.

See: `src/app/examples/google-analytics-example.tsx`

To implement Google Analytics across the site:
1. Get a Google Analytics measurement ID (G-XXXXXXXXXX)
2. Replace the Vercel Analytics component in `src/app/layout.tsx` with:
   ```tsx
   import { GoogleAnalytics } from '@next/third-parties/google';
   
   // In the layout component
   <html>
     <body>
       {/* ... */}
       <GoogleAnalytics gaId="G-XXXXXXXXXX" />
     </body>
   </html>
   ```

### Tracking Custom Events

With Vercel Analytics:
```tsx
import va from '@vercel/analytics';

function handleClick() {
  va.track('button_clicked', { 
    buttonType: 'submit',
    location: 'header'
  });
}
```

With Google Analytics:
```tsx
import { sendGAEvent } from '@next/third-parties/google';

function handleClick() {
  sendGAEvent('event', 'button_clicked', {
    event_category: 'engagement',
    event_label: 'submit_button',
    value: 1
  });
}
```

## Client Instrumentation (New in Next.js 15.3.2)

We've also implemented the new client instrumentation feature in Next.js 15.3.2, which allows for early analytics initialization.

See: `instrumentation-client.ts` in the root directory.

This file runs before your application's frontend code starts executing, making it ideal for setting up global analytics, error tracking, or performance monitoring tools.

## Choosing Between Options

- **Vercel Analytics**: Best for simple needs, privacy-focused, and lightweight page view tracking
- **Vercel Speed Insights**: Best for performance monitoring and Core Web Vitals tracking
- **Google Analytics**: Best for detailed analysis, marketing campaigns, and integration with Google products
- **Client Instrumentation**: Best for custom analytics implementation or when you need very early initialization

The current implementation uses both Vercel Analytics for page view tracking and Vercel Speed Insights for performance monitoring to provide a comprehensive analytics solution. This combination gives us the best of both worlds without adding significant overhead to the application. 