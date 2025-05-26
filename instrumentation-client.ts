// This file runs before your application's frontend code starts executing
// It's ideal for setting up analytics early in the application lifecycle

console.log('Initializing client instrumentation...');

// Example: Initialize analytics
if (typeof window !== 'undefined') {
  // Set up performance monitoring
  performance.mark('app-init');
  
  // You could initialize additional analytics here
  // For example:
  // - Track page load performance
  // - Set up error monitoring
  // - Initialize third-party analytics services

  // Example: Basic error tracking
  window.addEventListener('error', (event) => {
    console.error('Captured error:', event.error);
    // You could send this to your error tracking service
  });

  // Example: Track page navigation
  const trackPageView = () => {
    const url = window.location.href;
    console.log(`Page view: ${url}`);
    // You could send this to your analytics service
  };

  // Track initial page load
  trackPageView();

  // Track client-side navigation if using Next.js
  if (typeof window.history !== 'undefined') {
    const originalPushState = window.history.pushState;
    window.history.pushState = function(state, title, url) {
      // Call the original function
      originalPushState.call(this, state, title, url);
      // Track the page view
      setTimeout(trackPageView, 0);
    };

    // Handle back/forward navigation
    window.addEventListener('popstate', () => {
      setTimeout(trackPageView, 0);
    });
  }
} 