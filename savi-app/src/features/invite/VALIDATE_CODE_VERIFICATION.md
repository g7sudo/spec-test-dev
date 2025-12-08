# Validate-Code Endpoint Verification

## Step-by-Step Verification Checklist

### ✅ Step 1: Endpoint Structure

**Backend Specification:**
```
GET /api/v1/platform/resident-invites/validate-code?code=ABC123
[HttpGet("validate-code")]
[AllowAnonymous]
```

**Mobile Implementation:**
- ✅ Endpoint: `/v1/platform/resident-invites/validate-code`
- ✅ Base URL: `ENV.API_BASE_URL` (e.g., `http://localhost:5024/api`)
- ✅ Full URL: `{baseURL}/v1/platform/resident-invites/validate-code?code={code}`
- ✅ Query Parameter: `code` (normalized to uppercase, trimmed)
- ✅ Method: `GET`
- ✅ Auth: None (platform level, anonymous)

**Location:** `savi-app/src/services/api/residentInvite.ts:132-171`

---

### ✅ Step 2: Response DTO Structure

**Backend Response (Valid):**
```json
{
  "isValid": true,
  "errorMessage": null,
  "tenantId": "guid-here",
  "tenantCode": "maple-ridge",
  "tenantName": "Maple Ridge Community",
  "inviteId": "guid-here",
  "email": "resident-one@mailto.plus",
  "partyName": "John Doe",
  "unitLabel": "A-301",
  "role": "PrimaryResident",
  "expiresAt": "2025-01-08T...",
  "invitationToken": "76niy6jwba..."
}
```

**Backend Response (Invalid):**
```json
{
  "isValid": false,
  "errorMessage": "Invalid access code. Please check and try again.",
  "tenantId": null,
  "tenantCode": null,
  ...
}
```

**Mobile Interface:**
```typescript
export interface ValidateCodeResponse {
  isValid: boolean;
  tenantId?: string;
  tenantCode?: string;
  tenantName?: string;
  inviteId?: string;
  email?: string;
  partyName?: string;
  unitLabel?: string;
  role?: string;
  expiresAt?: string;
  invitationToken?: string;
  errorMessage?: string;
}
```

**Status:** ✅ Matches backend structure perfectly

**Location:** `savi-app/src/services/api/residentInvite.ts:24-37`

---

### ✅ Step 3: Saving tenantCode and invitationToken

**Requirement:** 
> "Your mobile app must save tenantCode and invitationToken from this response to use in the next step (accept invite)."

**Implementation:**

1. **Validation Check** (`JoinCommunityScreen.tsx:84-116`):
   ```typescript
   const hasRequiredFields = 
     response.isValid && 
     response.inviteId && 
     response.invitationToken && 
     response.email &&
     response.tenantCode && 
     response.tenantCode.trim() !== ''; // tenantCode must not be empty
   ```

2. **Storing in Context** (`JoinCommunityScreen.tsx:120-131`):
   ```typescript
   const inviteData = {
     inviteId: response.inviteId!,
     invitationToken: response.invitationToken!,  // ✅ SAVED
     email: response.email!,
     tenantId: response.tenantId!,
     tenantCode: response.tenantCode!.trim(),      // ✅ SAVED (trimmed)
     tenantName: response.tenantName!,
     unitLabel: response.unitLabel!,
     role: response.role!,
     partyName: response.partyName!,
     expiresAt: response.expiresAt,
   };
   setPendingInvite(inviteData);
   ```

3. **Context Storage** (`PendingInviteContext.tsx`):
   - ✅ Stores `PendingInvite` object in memory
   - ✅ Includes both `tenantCode` and `invitationToken`
   - ✅ Available throughout the auth flow

**Status:** ✅ Both `tenantCode` and `invitationToken` are saved correctly

---

### ✅ Step 4: Using Saved Values in Accept Call

**Usage in Accept Invite** (`useInviteAcceptance.ts:52-56`):
```typescript
const acceptResponse = await acceptInvite(
  pendingInvite.invitationToken,  // ✅ Using saved token
  firebaseToken,
  pendingInvite.tenantCode         // ✅ Using saved tenantCode
);
```

**Accept Invite Function** (`residentInvite.ts:260-303`):
- ✅ Validates `tenantCode` is not empty
- ✅ Uses `tenantCode` in URL: `/v1/${tenantCode}/resident-invites/accept`
- ✅ Uses `tenantCode` in header: `X-Tenant-Code: ${tenantCode}`
- ✅ Uses `invitationToken` in request body

**Status:** ✅ Saved values are correctly used in accept call

---

### ✅ Step 5: Error Handling

**Invalid Code Handling** (`JoinCommunityScreen.tsx:93-115`):
- ✅ Checks `response.isValid === false`
- ✅ Shows `response.errorMessage` from API
- ✅ Handles missing `tenantCode` with custom error message
- ✅ Logs detailed error information

**Network Error Handling** (`residentInvite.ts:172-220`):
- ✅ Catches network errors
- ✅ Provides platform-specific troubleshooting
- ✅ Logs detailed error information

**Status:** ✅ Comprehensive error handling implemented

---

## Summary

| Check | Status | Notes |
|-------|--------|-------|
| Endpoint Structure | ✅ | Matches backend exactly |
| Response DTO | ✅ | All fields match backend |
| Saving tenantCode | ✅ | Saved in context, trimmed |
| Saving invitationToken | ✅ | Saved in context |
| Using saved values | ✅ | Used correctly in accept call |
| Error Handling | ✅ | Handles invalid codes and network errors |
| Validation | ✅ | Validates required fields before storing |

---

## Files Involved

1. **API Service:** `savi-app/src/services/api/residentInvite.ts`
   - `validateAccessCode()` function (lines 132-220)
   - `ValidateCodeResponse` interface (lines 24-37)

2. **Screen:** `savi-app/src/features/invite/screens/JoinCommunityScreen.tsx`
   - Validation logic (lines 84-116)
   - Storing in context (lines 120-131)

3. **Context:** `savi-app/src/core/contexts/PendingInviteContext.tsx`
   - Stores `PendingInvite` object

4. **Hook:** `savi-app/src/features/invite/hooks/useInviteAcceptance.ts`
   - Uses saved values in accept call (lines 52-56)

---

## Testing Checklist

- [ ] Valid code returns `isValid: true` with all fields
- [ ] Invalid code returns `isValid: false` with `errorMessage`
- [ ] `tenantCode` is saved correctly (check logs)
- [ ] `invitationToken` is saved correctly (check logs)
- [ ] Empty `tenantCode` shows error message
- [ ] Saved values are used in accept call (check logs)
- [ ] Network errors are handled gracefully

