/**
 * PendingInviteContext
 * 
 * Stores invite data after validation, to be used after Firebase authentication
 * for accepting the invite. This data is kept in memory only (not persisted).
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { PendingInvite } from '@/services/api/residentInvite';

interface PendingInviteContextType {
  pendingInvite: PendingInvite | null;
  setPendingInvite: (invite: PendingInvite | null) => void;
  clearPendingInvite: () => void;
}

const PendingInviteContext = createContext<PendingInviteContextType | undefined>(undefined);

export const PendingInviteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pendingInvite, setPendingInvite] = useState<PendingInvite | null>(null);

  const clearPendingInvite = () => {
    setPendingInvite(null);
  };

  return (
    <PendingInviteContext.Provider value={{ pendingInvite, setPendingInvite, clearPendingInvite }}>
      {children}
    </PendingInviteContext.Provider>
  );
};

export const usePendingInvite = () => {
  const context = useContext(PendingInviteContext);
  if (!context) {
    throw new Error('usePendingInvite must be used within PendingInviteProvider');
  }
  return context;
};

