'use client';

/**
 * Toast Provider using Radix Toast
 * Provides global toast notifications
 */

import { ReactNode } from 'react';
import * as Toast from '@radix-ui/react-toast';

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  return (
    <Toast.Provider swipeDirection="right">
      {children}
      
      {/* Toast viewport - where toasts appear */}
      <Toast.Viewport className="fixed bottom-0 right-0 z-[100] m-4 flex max-w-[420px] flex-col gap-2" />
    </Toast.Provider>
  );
}

