'use client';

import React, { useEffect, isValidElement, cloneElement } from 'react';
import va from '@vercel/analytics';

interface EventTrackingProps {
  eventName: string;
  properties?: Record<string, any>;
  trackOnMount?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
}

/**
 * A component that tracks events using Vercel Analytics
 * 
 * Usage examples:
 * 
 * 1. Track on mount (page view, component render)
 * <EventTracking eventName="page_viewed" properties={{ page: 'dashboard' }} trackOnMount />
 * 
 * 2. Track on click (button, link)
 * <EventTracking eventName="button_clicked" properties={{ button: 'login' }}>
 *   <button>Login</button>
 * </EventTracking>
 * 
 * 3. Track on click with custom onClick handler
 * <EventTracking 
 *   eventName="profile_viewed" 
 *   properties={{ userId: '123' }}
 *   onClick={() => console.log('Profile viewed')}
 * >
 *   <a href="/profile">View Profile</a>
 * </EventTracking>
 */
export default function EventTracking({
  eventName,
  properties,
  trackOnMount = false,
  children,
  onClick
}: EventTrackingProps) {
  // Track event on component mount if trackOnMount is true
  useEffect(() => {
    if (trackOnMount) {
      va.track(eventName, properties);
    }
  }, [eventName, properties, trackOnMount]);

  // If no children, just track on mount (if configured) and return null
  if (!children) {
    return null;
  }

  // If children provided, wrap them to add click tracking
  const handleClick = (e: React.MouseEvent) => {
    va.track(eventName, properties);
    if (onClick) onClick();
  };

  // For simple text or multiple children, wrap in a span
  return (
    <div onClick={handleClick} style={{ display: 'contents' }}>
      {children}
    </div>
  );
} 