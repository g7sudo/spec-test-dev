/**
 * Visitors API functions
 * Handles tenant-level visitor pass operations
 * Includes Overview stats and pass management
 */

import { httpClient } from '@/lib/http';
import {
  VisitorOverview,
  GetVisitorOverviewParams,
} from '@/types/visitor';

// ============================================
// API Endpoints
// ============================================

const VISITORS_BASE = '/api/v1/tenant/visitors/passes';

// ============================================
// Overview / Dashboard
// ============================================

/**
 * Gets visitor overview statistics for dashboard
 * Shows counts by status, type, and source for the specified date (defaults to today)
 */
export async function getVisitorOverview(
  params: GetVisitorOverviewParams = {}
): Promise<VisitorOverview> {
  const searchParams = new URLSearchParams();

  // Add date parameter if provided
  if (params.date) {
    searchParams.set('date', params.date);
  }

  const query = searchParams.toString();
  const url = query ? `${VISITORS_BASE}/overview?${query}` : `${VISITORS_BASE}/overview`;

  return httpClient.get<VisitorOverview>(url);
}

