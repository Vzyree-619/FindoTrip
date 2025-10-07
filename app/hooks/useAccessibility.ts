import React, { useEffect, useState } from "react";

// Hook for managing focus trap
export function useFocusTrap(isActive: boolean) {
  useEffect(() => {
    if (!isActive) return;

    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isActive]);
}

// Hook for keyboard navigation
export function useKeyboardNavigation(
  items: any[],
  onSelect: (index: number) => void,
  isActive: boolean = true
) {
  const [focusedIndex, setFocusedIndex] = useState(-1);

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => 
            prev < items.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : items.length - 1
          );
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusedIndex >= 0) {
            onSelect(focusedIndex);
          }
          break;
        case 'Escape':
          setFocusedIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items.length, focusedIndex, onSelect, isActive]);

  return { focusedIndex, setFocusedIndex };
}

// Hook for screen reader announcements
export function useScreenReader() {
  const [announcement, setAnnouncement] = useState('');

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement(''); // Clear first to ensure re-announcement
    setTimeout(() => setAnnouncement(message), 100);
  };

  return { announcement, announce };
}

// Hook for reduced motion preference
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

// Hook for high contrast preference
export function useHighContrast() {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersHighContrast;
}

// Utility functions for accessibility
export const a11yUtils = {
  // Generate unique IDs for form elements
  generateId: (prefix: string = 'element') => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Format price for screen readers
  formatPriceForScreenReader: (price: number, currency: string = 'PKR') => {
    return `${price.toLocaleString()} ${currency}`;
  },

  // Format date for screen readers
  formatDateForScreenReader: (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  // Create ARIA label for ratings
  createRatingLabel: (rating: number, maxRating: number = 5, reviewCount?: number) => {
    const ratingText = `${rating} out of ${maxRating} stars`;
    const reviewText = reviewCount ? ` based on ${reviewCount} reviews` : '';
    return ratingText + reviewText;
  },

  // Create ARIA label for pagination
  createPaginationLabel: (current: number, total: number) => {
    return `Page ${current} of ${total}`;
  },

  // Create ARIA label for search results
  createSearchResultsLabel: (count: number, query?: string) => {
    const queryText = query ? ` for "${query}"` : '';
    return `${count} results found${queryText}`;
  }
};

// Component for screen reader announcements
export function ScreenReaderAnnouncement({ 
  message, 
  priority = 'polite' 
}: { 
  message: string; 
  priority?: 'polite' | 'assertive' 
}) {
  return React.createElement('div', {
    role: "status",
    'aria-live': priority,
    'aria-atomic': "true",
    className: "sr-only"
  }, message);
}

// Skip to content link
export function SkipToContent() {
  return React.createElement('a', {
    href: "#main-content",
    className: "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-[#01502E] text-white px-4 py-2 rounded-md z-50 focus:outline-none focus:ring-2 focus:ring-white"
  }, "Skip to main content");
}
