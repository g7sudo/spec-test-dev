import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * ScrollDirectionContext
 * 
 * Provides scroll direction state to control bottom navigation visibility.
 * When scrolling up, bottom nav hides. When scrolling down, bottom nav shows.
 */
interface ScrollDirectionContextType {
  isScrollingUp: boolean;
  setIsScrollingUp: (value: boolean) => void;
}

const ScrollDirectionContext = createContext<ScrollDirectionContextType | undefined>(undefined);

export const ScrollDirectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isScrollingUp, setIsScrollingUp] = useState(false);

  // Wrapper that only updates state when value actually changes (prevents unnecessary re-renders)
  const setIsScrollingUpWithCheck = React.useCallback((value: boolean) => {
    setIsScrollingUp((prev) => {
      // Skip update if value hasn't changed
      if (prev === value) return prev;
      return value;
    });
  }, []);

  return (
    <ScrollDirectionContext.Provider value={{ isScrollingUp, setIsScrollingUp: setIsScrollingUpWithCheck }}>
      {children}
    </ScrollDirectionContext.Provider>
  );
};

export const useScrollDirection = () => {
  const context = useContext(ScrollDirectionContext);
  if (!context) {
    throw new Error('useScrollDirection must be used within ScrollDirectionProvider');
  }
  return context;
};

