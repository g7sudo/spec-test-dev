# Accept Invite API Verification

## Backend Specification

**Endpoint:** `POST /api/v1/tenant/resident-invites/accept`

**Headers:**
- `Authorization: Bearer <firebase-id-token>`
- `X-Tenant-Code: <tenant-code>` (e.g., "maple-ridge")

**Request Body:**
```json
{
  "inviteId": "guid-from-validate-code",
  "token": "invitationToken-from-validate-code"
}
```

**Key Points:**
- ✅ Tenant code is passed via `X-Tenant-Code` header, **NOT** in the URL path
- ✅ Request body uses `inviteId` and `token` (not `invitationToken`)

---

## Mobile Implementation Verification

### ✅ Step 1: Endpoint Structure

**Implementation:**
- ✅ Endpoint: `/v1/tenant/resident-invites/accept` (fixed path, no tenantCode in URL)
- ✅ Base URL: `ENV.API_BASE_URL` (e.g., `http://localhost:5024/api`)
- ✅ Full URL: `{baseURL}/v1/tenant/resident-invites/accept`
- ✅ Method: `POST`
- ✅ Auth: Required (Firebase token)

**Location:** `savi-app/src/services/api/residentInvite.ts:305-363`

---

### ✅ Step 2: Request Body Structure

**Backend Expects:**
```json
{
  "inviteId": "guid-from-validate-code",
  "token": "invitationToken-from-validate-code"
}
```

**Mobile Interface:**
```typescript
export interface AcceptInviteRequest {
  inviteId: string;
  token: string;
}
```

**Implementation:**
```typescript
{
  inviteId: inviteId.trim(),
  token: invitationToken.trim(),
}
```

**Status:** ✅ Matches backend structure perfectly

**Location:** `savi-app/src/services/api/residentInvite.ts:42-47`

---

### ✅ Step 3: Headers

**Backend Requires:**
- `Authorization: Bearer <firebase-id-token>`
- `X-Tenant-Code: <tenant-code>`

**Implementation:**
```typescript
headers: {
  Authorization: `Bearer ${firebaseToken}`,
  'X-Tenant-Code': trimmedTenantCode, // ✅ Tenant code in header, not URL
  'Content-Type': 'application/json',
}
```

**Status:** ✅ Headers match backend specification

**Location:** `savi-app/src/services/api/residentInvite.ts:357-362`

---

### ✅ Step 4: Function Signature

**Function:**
```typescript
export async function acceptInvite(
  inviteId: string,           // ✅ First parameter
  invitationToken: string,    // ✅ Second parameter
  firebaseToken: string,       // ✅ Third parameter
  tenantCode: string           // ✅ Fourth parameter
): Promise<AcceptInviteResponse>
```

**Usage in Hook:**
```typescript
const acceptResponse = await acceptInvite(
  pendingInvite.inviteId,              // ✅ Pass inviteId
  pendingInvite.invitationToken,       // ✅ Pass invitationToken
  firebaseToken,                        // ✅ Pass Firebase token
  pendingInvite.tenantCode             // ✅ Pass tenantCode
);
```

**Status:** ✅ Function signature matches requirements

**Location:** 
- Function: `savi-app/src/services/api/residentInvite.ts:305-310`
- Usage: `savi-app/src/features/invite/hooks/useInviteAcceptance.ts:55-59`

---

### ✅ Step 5: Validation

**Validations Implemented:**
1. ✅ `tenantCode` is not empty
2. ✅ `inviteId` is not empty
3. ✅ `invitationToken` is not empty
4. ✅ All values are trimmed before use

**Location:** `savi-app/src/services/api/residentInvite.ts:311-330`

---

### ✅ Step 6: Error Handling

**Error Handling:**
- ✅ Network errors caught and logged
- ✅ API errors with status codes handled
- ✅ Detailed error logging for debugging
- ✅ Validation errors throw clear messages

**Location:** `savi-app/src/services/api/residentInvite.ts:374-390`

---

## Summary

| Check | Status | Notes |
|-------|--------|-------|
| Endpoint Path | ✅ | `/v1/tenant/resident-invites/accept` (fixed, no tenantCode) |
| Request Body | ✅ | `{ inviteId, token }` matches backend |
| Headers | ✅ | `Authorization` and `X-Tenant-Code` correct |
| Function Signature | ✅ | Parameters in correct order |
| Validation | ✅ | All required fields validated |
| Error Handling | ✅ | Comprehensive error handling |

---

## Key Changes Made

1. **Endpoint Changed:**
   - ❌ Old: `/v1/${tenantCode}/resident-invites/accept`
   - ✅ New: `/v1/tenant/resident-invites/accept`

2. **Request Body Changed:**
   - ❌ Old: `{ invitationToken: string }`
   - ✅ New: `{ inviteId: string, token: string }`

3. **Function Signature Changed:**
   - ❌ Old: `acceptInvite(invitationToken, firebaseToken, tenantCode)`
   - ✅ New: `acceptInvite(inviteId, invitationToken, firebaseToken, tenantCode)`

4. **Tenant Code Location:**
   - ❌ Old: In URL path
   - ✅ New: In `X-Tenant-Code` header only

---

## Files Modified

1. **`savi-app/src/services/api/residentInvite.ts`**
   - Updated `AcceptInviteRequest` interface
   - Updated `acceptInvite()` function signature
   - Updated endpoint path
   - Updated request body structure
   - Updated headers (tenantCode in header, not URL)

2. **`savi-app/src/features/invite/hooks/useInviteAcceptance.ts`**
   - Updated `acceptInvite()` call to pass `inviteId` as first parameter

---

## Testing Checklist

- [ ] Valid invite accepted successfully
- [ ] `inviteId` is passed correctly in request body
- [ ] `token` is passed correctly in request body
- [ ] `X-Tenant-Code` header is set correctly
- [ ] `Authorization` header is set correctly
- [ ] Empty `tenantCode` shows validation error
- [ ] Empty `inviteId` shows validation error
- [ ] Empty `invitationToken` shows validation error
- [ ] Network errors are handled gracefully
- [ ] API errors are logged with details

