'use client';

import { useEffect } from 'react';

interface ListingViewTrackerProps {
  listingId: string;
}

export default function ListingViewTracker({ listingId }: { listingId: string }) {
  useEffect(() => {
    // Fire-and-forget view event tracker
    fetch(`/api/listings/${listingId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: 'VIEW' }),
    }).catch((err) => {
      console.error('Error logging page view event:', err);
    });
  }, [listingId]);

  return null;
}
