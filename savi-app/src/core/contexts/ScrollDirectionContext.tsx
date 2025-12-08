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

  // Wrapper to log state changes
  const setIsScrollingUpWithLog = React.useCallback((value: boolean) => {
    console.log('[ScrollDirectionContext] 🔄 State change:', {
      from: isScrollingUp,
      to: value,
    });
    setIsScrollingUp(value);
  }, [isScrollingUp]);

  return (
    <ScrollDirectionContext.Provider value={{ isScrollingUp, setIsScrollingUp: setIsScrollingUpWithLog }}>
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

