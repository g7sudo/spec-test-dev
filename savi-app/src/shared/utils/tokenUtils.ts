/**
 * JWT Token Utilities
 * 
 * Provides helper functions for working with JWT tokens,
 * including expiration checking and decoding.
 */

/**
 * Decoded JWT payload structure (minimal for expiration checking)
 */
interface JwtPayload {
  exp?: number;  // Expiration time (Unix timestamp in seconds)
  iat?: number;  // Issued at time
  sub?: string;  // Subject (usually user ID)
}

/**
 * Decodes a JWT token without verification
 * 
 * Note: This only decodes the payload - it does NOT verify the signature.
 * Use this only for reading claims like expiration time.
 * 
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    // JWT structure: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('[TokenUtils] Invalid JWT format - expected 3 parts');
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    
    // Base64Url decode (replace URL-safe characters)
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    
    // Decode and parse JSON
    const jsonPayload = atob(base64);
    return JSON.parse(jsonPayload) as JwtPayload;
  } catch (error) {
    console.warn('[TokenUtils] Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Checks if a JWT token is expired
 * 
 * @param token - JWT token string
 * @param bufferSeconds - Buffer time before actual expiration (default: 60 seconds)
 *                        This helps prevent edge cases where token expires mid-request
 * @returns true if token is expired or will expire within buffer time
 */
export function isTokenExpired(token: string | null, bufferSeconds: number = 60): boolean {
  // No token = considered expired
  if (!token) {
    console.log('[TokenUtils] No token provided - treating as expired');
    return true;
  }

  const payload = decodeJwtPayload(token);
  
  // If we can't decode, treat as expired for safety
  if (!payload || !payload.exp) {
    console.warn('[TokenUtils] Could not decode token or no exp claim - treating as expired');
    return true;
  }

  // Get current time in seconds (JWT exp is in seconds)
  const currentTimeSeconds = Math.floor(Date.now() / 1000);
  
  // Check if expired (with buffer)
  const expirationWithBuffer = payload.exp - bufferSeconds;
  const isExpired = currentTimeSeconds >= expirationWithBuffer;

  if (isExpired) {
    const expiredAgo = currentTimeSeconds - payload.exp;
    console.log('[TokenUtils] Token is expired', {
      expiredSecondsAgo: expiredAgo > 0 ? expiredAgo : 0,
      expiresInSeconds: expiredAgo < 0 ? Math.abs(expiredAgo) : 0,
      bufferApplied: bufferSeconds,
    });
  }

  return isExpired;
}

/**
 * Gets the expiration date from a JWT token
 * 
 * @param token - JWT token string
 * @returns Date object of expiration, or null if invalid
 */
export function getTokenExpirationDate(token: string | null): Date | null {
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return null;

  // Convert seconds to milliseconds for Date constructor
  return new Date(payload.exp * 1000);
}

/**
 * Gets remaining time until token expires
 * 
 * @param token - JWT token string
 * @returns Remaining milliseconds, or 0 if expired, or null if invalid token
 */
export function getTokenRemainingTime(token: string | null): number | null {
  if (!token) return null;

  const expDate = getTokenExpirationDate(token);
  if (!expDate) return null;

  const remaining = expDate.getTime() - Date.now();
  return Math.max(0, remaining);
}
