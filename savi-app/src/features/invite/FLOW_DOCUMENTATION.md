# Resident Invite Flow - Complete Implementation Documentation

## Overview
This document describes the complete flow when a user enters an access code to join a community.

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. JoinCommunityScreen                                          │
│    User enters 6-digit access code                              │
│    → API: GET /v1/platform/resident-invites/validate-code      │
│    → Stores invite data in PendingInviteContext                │
│    → Navigates to SetupAccountScreen                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. SetupAccountScreen                                            │
│    User enters password (email pre-filled)                      │
│    → Firebase SDK: createUserWithEmailAndPassword()             │
│    → Firebase SDK: getIdToken()                                 │
│    → Navigates to TenantSelectionScreen                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. TenantSelectionScreen                                         │
│    Shows list of tenant memberships                             │
│    → API: GET /v1/platform/auth/me                              │
│    → User selects tenant                                        │
│    → API: POST /v1/tenant/resident-invites/accept             │
│    → API: GET /v1/platform/auth/me (refresh)                    │
│    → Updates auth store, selects tenant                          │
│    → Navigates to Main app                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Flow Details

### Step 1: JoinCommunityScreen - Validate Access Code

**Screen:** `JoinCommunityScreen.tsx`

**User Action:** Enters 6-digit access code (e.g., "R5F4JD")

**API Call:**
```
GET /api/v1/platform/resident-invites/validate-code?code=R5F4JD
```

**Request:**
- Method: `GET`
- Auth: None (platform level, anonymous)
- Query Params:
  - `code`: Access code (normalized to uppercase, trimmed)

**Response (Valid):**
```json
{
  "isValid": true,
  "errorMessage": null,
  "tenantId": "529efcfb-9150-4249-9b94-afacdd106047",
  "tenantCode": "",  // Can be empty
  "tenantName": "Community",
  "inviteId": "ff3e9cb9-9f4d-4266-8778-1aa178e60652",
  "email": "resident-one@mailto.plus",
  "partyName": "Resident One",
  "unitLabel": "Tower A-A0101",
  "role": "PrimaryResident",
  "expiresAt": "2025-12-15T15:44:29.600192",
  "invitationToken": "S-cbh3p-Jm0xBZTwxlffURm8svdLLe-xz3k-hk8vle8"
}
```

**Response (Invalid):**
```json
{
  "isValid": false,
  "errorMessage": "Invalid access code. Please check and try again.",
  "tenantId": null,
  "tenantCode": null,
  ...
}
```

**What Happens:**
1. ✅ Validates `isValid === false` → Shows `errorMessage`
2. ✅ Validates required fields: `inviteId`, `invitationToken`, `email`, `tenantId`
3. ✅ Stores invite data in `PendingInviteContext`:
   - `inviteId`
   - `invitationToken`
   - `email`
   - `tenantId` (required)
   - `tenantCode` (can be empty, will get from tenant selection)
   - `tenantName`, `unitLabel`, `role`, `partyName`, `expiresAt`
4. ✅ Navigates to `SetupAccountScreen`

**Error Handling:**
- If `isValid === false`: Shows `errorMessage` from API
- If missing required fields: Shows error message
- Network errors: Shows network error message

---

### Step 2: SetupAccountScreen - Create Firebase Account

**Screen:** `SetupAccountScreen.tsx`

**User Action:** Enters password (email is pre-filled and read-only)

**Firebase SDK Calls:**
1. `signUpWithEmail(email, password)` - Creates Firebase account
2. `getIdToken()` - Gets Firebase ID token

**What Happens:**
1. ✅ User enters password and confirms password
2. ✅ Validates password (min 6 characters, passwords match)
3. ✅ Calls Firebase SDK `signUpWithEmail()` to create account
4. ✅ Gets Firebase ID token using `getIdToken()`
5. ✅ Navigates to `TenantSelectionScreen` with `firebaseToken`

**Error Handling:**
- Firebase errors: Shows Firebase error messages (email already in use, weak password, etc.)
- Network errors: Shows network error message

---

### Step 3: TenantSelectionScreen - Select Tenant & Accept Invite

**Screen:** `TenantSelectionScreen.tsx`

**User Action:** Selects a tenant from the list (or auto-selected if only one)

**API Calls:**

#### 3.1 Get Tenant Memberships
```
GET /api/v1/platform/auth/me
```

**Request:**
- Method: `GET`
- Auth: `Authorization: Bearer <firebase-id-token>`
- Headers:
  - `Authorization`: Firebase ID token
  - `Content-Type`: `application/json`

**Response:**
```json
{
  "userId": "19d5dfd6-c8a6-49f5-9939-8c404c99f593",
  "displayName": "Green Admin",
  "email": "green-meadows@mailto.plus",
  "phoneNumber": null,
  "globalRoles": [],
  "tenantMemberships": [
    {
      "tenantId": "529efcfb-9150-4249-9b94-afacdd106047",
      "tenantSlug": "green-meadows",
      "tenantName": "Green Meadows Community",
      "roles": ["COMMUNITY_ADMIN"]
    }
  ],
  "currentScope": null
}
```

**What Happens:**
1. ✅ Calls `/v1/platform/auth/me` to get tenant memberships
2. ✅ Displays list of tenants with tenant names
3. ✅ Auto-selects if only one tenant
4. ✅ User selects a tenant

#### 3.2 Accept Invite
```
POST /api/v1/tenant/resident-invites/accept
```

**Request:**
- Method: `POST`
- Auth: `Authorization: Bearer <firebase-id-token>`
- Headers:
  - `Authorization`: Firebase ID token
  - `X-Tenant-Code`: `<tenant-slug>` (e.g., "green-meadows")
  - `Content-Type`: `application/json`
- Body:
```json
{
  "inviteId": "ff3e9cb9-9f4d-4266-8778-1aa178e60652",
  "token": "S-cbh3p-Jm0xBZTwxlffURm8svdLLe-xz3k-hk8vle8"
}
```

**Response:**
```json
{
  "success": true,
  "communityUserId": "...",
  "leaseId": "...",
  "unitLabel": "Tower A-A0101"
}
```

**What Happens:**
1. ✅ Uses `tenantSlug` from selected tenant as `tenantCode` for header
2. ✅ Calls `acceptInvite()` with:
   - `inviteId` from pending invite
   - `invitationToken` from pending invite
   - `firebaseToken` (fresh token)
   - `tenantCode` (from `tenantSlug`)
3. ✅ Refreshes `/v1/platform/auth/me` to get updated profile
4. ✅ Updates auth store with user and membership
5. ✅ Selects tenant and unit
6. ✅ Clears pending invite
7. ✅ Navigates to Main app

**Error Handling:**
- API errors: Shows error message
- Missing tenant code: Shows error
- Network errors: Shows network error message

---

## Complete API List

### 1. Validate Access Code
**Endpoint:** `GET /api/v1/platform/resident-invites/validate-code?code={code}`

**Auth:** None (anonymous)

**Purpose:** Validates 6-digit access code and returns invite details

**Response Fields:**
- `isValid`: boolean
- `errorMessage`: string | null
- `tenantId`: string (required)
- `tenantCode`: string (can be empty)
- `tenantName`: string
- `inviteId`: string (required)
- `invitationToken`: string (required)
- `email`: string (required)
- `partyName`: string
- `unitLabel`: string
- `role`: string
- `expiresAt`: string

---

### 2. Get User Profile & Tenant Memberships
**Endpoint:** `GET /api/v1/platform/auth/me`

**Auth:** Required (Firebase ID token)

**Headers:**
- `Authorization: Bearer <firebase-id-token>`

**Purpose:** Gets current user profile and tenant memberships after Firebase auth

**Response Fields:**
- `userId`: string
- `displayName`: string
- `email`: string
- `phoneNumber`: string | null
- `globalRoles`: string[]
- `tenantMemberships`: Array<{
    - `tenantId`: string
    - `tenantSlug`: string (used as tenantCode)
    - `tenantName`: string
    - `roles`: string[]
  }>
- `currentScope`: string | null

---

### 3. Accept Invite
**Endpoint:** `POST /api/v1/tenant/resident-invites/accept`

**Auth:** Required (Firebase ID token)

**Headers:**
- `Authorization: Bearer <firebase-id-token>`
- `X-Tenant-Code: <tenant-slug>` (e.g., "green-meadows")

**Body:**
```json
{
  "inviteId": "guid-from-validate-code",
  "token": "invitationToken-from-validate-code"
}
```

**Purpose:** Accepts the resident invite and sets up user in tenant

**Response Fields:**
- `success`: boolean
- `communityUserId`: string
- `leaseId`: string
- `unitLabel`: string
- `error`: string | null

---

## Firebase SDK Calls

### 1. Create User Account
**Function:** `signUpWithEmail(email, password)`

**Purpose:** Creates new Firebase account with email and password

**Returns:** Firebase User object

**Errors:**
- `auth/email-already-in-use`: Email already registered
- `auth/weak-password`: Password too weak
- `auth/invalid-email`: Invalid email format
- `auth/network-request-failed`: Network error

---

### 2. Get ID Token
**Function:** `getIdToken(forceRefresh?)`

**Purpose:** Gets Firebase ID token for authenticated user

**Returns:** Firebase ID token (JWT string)

**Errors:**
- No authenticated user: Throws error

---

## State Management

### PendingInviteContext
Stores invite data between screens:
- `inviteId`: string
- `invitationToken`: string
- `email`: string
- `tenantId`: string (required)
- `tenantCode`: string (can be empty)
- `tenantName`: string
- `unitLabel`: string
- `role`: string
- `partyName`: string
- `expiresAt`: string | undefined

**Cleared:** After successful invite acceptance

---

## Navigation Flow

```
JoinCommunityScreen
  ↓ (valid code)
SetupAccountScreen
  ↓ (Firebase account created)
TenantSelectionScreen
  ↓ (tenant selected, invite accepted)
Main App
```

---

## Error Scenarios

### Invalid Access Code
- **API Response:** `isValid: false`
- **Action:** Show `errorMessage` from API
- **User Action:** Can retry with different code

### Missing Required Fields
- **Check:** `inviteId`, `invitationToken`, `email`, `tenantId`
- **Action:** Show error message
- **User Action:** Contact support

### Firebase Account Creation Failed
- **Errors:** Email already in use, weak password, network error
- **Action:** Show Firebase error message
- **User Action:** Fix password or sign in if account exists

### No Tenant Memberships
- **API Response:** Empty `tenantMemberships` array
- **Action:** Show error message
- **User Action:** Contact support

### Accept Invite Failed
- **Errors:** Expired invite, already accepted, network error
- **Action:** Show error message
- **User Action:** Contact support or retry

---

## Key Implementation Details

### tenantCode Handling
- **From validate-code:** Can be empty string `""`
- **Solution:** Use `tenantSlug` from tenant selection as `tenantCode`
- **Accept invite:** Uses `X-Tenant-Code` header with `tenantSlug`

### Auto-Selection
- If only one tenant in `tenantMemberships`, automatically selects and accepts

### Token Management
- Fresh Firebase token obtained before each API call
- Token passed via `Authorization` header

### Loading States
- Global loading state managed by `apiLoadingStore`
- Loading overlay shown automatically during API calls
- Buttons disabled during API calls

---

## Files Involved

### Screens
- `savi-app/src/features/invite/screens/JoinCommunityScreen.tsx`
- `savi-app/src/features/invite/screens/SetupAccountScreen.tsx`
- `savi-app/src/features/invite/screens/TenantSelectionScreen.tsx`

### API Services
- `savi-app/src/services/api/residentInvite.ts` - `validateAccessCode()`, `acceptInvite()`
- `savi-app/src/services/api/auth.ts` - `getAuthMe()`

### Firebase Services
- `savi-app/src/services/firebase/auth.ts` - `signUpWithEmail()`, `getIdToken()`

### State Management
- `savi-app/src/core/contexts/PendingInviteContext.tsx` - Stores invite data
- `savi-app/src/state/apiLoadingStore.ts` - Global loading state
- `savi-app/src/state/authStore.ts` - Auth state
- `savi-app/src/state/tenantStore.ts` - Tenant state

### Navigation
- `savi-app/src/app/navigation/types.ts` - Navigation types
- `savi-app/src/app/navigation/AuthNavigator.tsx` - Auth stack navigator

