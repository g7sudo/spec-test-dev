/**
 * CommunityScreen
 * 
 * Main community/announcements screen.
 * Now uses the AnnouncementsFeedScreen content for displaying announcements.
 */

import React from 'react';
import { AnnouncementsFeedScreen } from '@/features/announcements/screens/AnnouncementsFeedScreen';

/**
 * CommunityScreen - Wrapper for announcements feed
 * 
 * This screen serves as the main entry point for the Community tab.
 * It renders the AnnouncementsFeedScreen which handles:
 * - Category filtering
 * - Infinite scroll pagination
 * - Pull-to-refresh
 * - Navigation to announcement details
 */
export const CommunityScreen: React.FC = () => {
  // Render the announcements feed screen directly
  // This provides a seamless experience where Community = Announcements
  return <AnnouncementsFeedScreen />;
};

export default CommunityScreen;
