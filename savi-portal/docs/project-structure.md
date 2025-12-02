Project Structure to Follow 

	1.	Project folder structure (Next.js App Router, TypeScript, Radix)
	2.	Where global HTTP error/session handling lives
	3.	How to plug in:
	•	Global exceptions
	•	Unauthorized / 403
	•	404 / Not found
	•	Token expiry → “Continue session / Sign out”


⸻

1. High-level folder structure

I’ll assume src/ layout with Next App Router:

.
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── reset-password/
│   │   │   └── page.tsx
│   │   └── layout.tsx                 // Minimal layout for auth pages
│   │
│   ├── (platform)/
│   │   └── platform/
│   │       ├── layout.tsx             // Platform shell (SSR)
│   │       ├── dashboard/
│   │       │   └── page.tsx
│   │       ├── tenants/
│   │       │   └── page.tsx
│   │       └── users/
│   │           └── page.tsx
│   │
│   ├── (tenant)/
│   │   └── tenant/
│   │       └── [tenantSlug]/
│   │           ├── layout.tsx         // Tenant shell (SSR)
│   │           ├── dashboard/
│   │           │   └── page.tsx
│   │           ├── people/
│   │           │   └── page.tsx
│   │           ├── amenities/
│   │           │   └── page.tsx
│   │           └── maintenance/
│   │               └── page.tsx
│   │
│   ├── account/
│   │   └── profile/
│   │       └── page.tsx               // Uses whichever shell is active
│   │
│   ├── error.tsx                      // Global app error boundary (SSR)
│   ├── not-found.tsx                  // Global 404 fallback
│   └── layout.tsx                     // Root layout (AppProviders)
│
├── middleware.ts                      // Auth + redirect guard (SSR edge)
│
├── src/
│   ├── config/
│   │   ├── env.ts                     // env vars mapping (API base URL, etc.)
│   │   └── routes.ts                  // route helpers, constants
│   │
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── request-context.ts     // buildRequestContext() from cookies + /auth/me
│   │   │   ├── scope.ts               // helpers for platform vs tenant scope
│   │   │   └── guards.ts              // requirePlatformAccess(), requireTenantAccess()
│   │   ├── http/
│   │   │   ├── client.ts              // fetch wrapper (SSR + client)
│   │   │   ├── errors.ts              // ApiError, UnauthorizedError, etc.
│   │   │   └── interceptors.ts        // map HTTP -> typed errors
│   │   ├── errors/
│   │   │   ├── global-error-boundary.tsx  // client-side error boundary
│   │   │   └── error-mapping.ts           // map ApiError → user-friendly messages
│   │   ├── store/
│   │   │   └── session-store.ts       // Zustand or context for session state
│   │   └── utils/
│   │       └── index.ts               // misc helpers
│   │
│   ├── modules/
│   │   ├── platform/
│   │   │   ├── api/                   // typed API calls for platform scope
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   ├── tenant/
│   │   │   ├── api/                   // typed API calls for tenant scope
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   └── account/
│   │       ├── api/
│   │       └── components/
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx           // root shell pieces
│   │   │   ├── TopBar.tsx
│   │   │   ├── SideNav.tsx
│   │   │   └── ScopeDropdown.tsx
│   │   ├── feedback/
│   │   │   ├── GlobalToaster.tsx
│   │   │   ├── SessionExpiredDialog.tsx
│   │   │   └── InlineError.tsx
│   │   ├── ui/                        // Radix-based primitives
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   └── ...
│   │   └── icons/
│   │
│   ├── providers/
│   │   ├── AppProviders.tsx           // wraps children with Error + Session + Query
│   │   ├── ErrorProvider.tsx          // connects ApiError → toast/dialog
│   │   └── SessionProvider.tsx        // handles session expiry dialog
│   │
│   └── types/
│       ├── auth.ts                    // User, Permission, TenantMembership
│       ├── http.ts                    // ApiError types
│       └── index.ts
│
├── tsconfig.json
└── package.json

Key idea: app/ holds routes/layouts, src/ holds “domain”, infra and UI building blocks.

⸻

2. Global HTTP exception handling (any module → one handler)

2.1 Shared HTTP client

All API calls go through one place: src/lib/http/client.ts.

Conceptually:
	•	Wrap fetch (or Axios) with:
	•	base URL
	•	credentials/cookies
	•	error mapping

Errors get mapped to typed exceptions, e.g.:
	•	ApiError (base)
	•	UnauthorizedError (401, 419)
	•	ForbiddenError (403)
	•	NotFoundError (404)
	•	ValidationError (422 or custom)
	•	ServerError (500+)

Each module uses the shared client:

// src/modules/platform/api/tenants.ts
export async function listTenants() {
  return httpClient.get<PaginatedTenants>("/platform/tenants");
}

If anything goes wrong, httpClient throws one of those *Error classes.

2.2 Mapping errors to UI globally

You wire all that into a client-side global error handler:
	•	src/lib/errors/global-error-boundary.tsx
	•	src/providers/ErrorProvider.tsx
	•	src/components/feedback/GlobalToaster.tsx

Pattern:
	•	React error boundary catches React-level render errors.
	•	Custom hooks or data fetching (React Query / SWR) catch ApiErrors and send them to a central handler in ErrorProvider.
	•	ErrorProvider decides:
	•	Show toast (for transient/network/server errors).
	•	Navigate to /unauthorized or /account/profile for 403-like errors (or better: show dedicated page in the layout).
	•	For NotFoundError in page-level data → call notFound() (Next’s helper) to render not-found.tsx.

So any module that throws ApiError gets translated into consistent UX by one mechanism.

⸻

3. Session handler & “Continue session / Sign out” flow

You want:
	•	Token expires.
	•	Instead of silently failing, show:
	•	“Your session has expired. Continue session / Sign out”.

3.1 Where session logic lives

Use a dedicated session module:
	•	src/lib/store/session-store.ts (Zustand or context)
	•	src/providers/SessionProvider.tsx
	•	src/components/feedback/SessionExpiredDialog.tsx

3.2 How we detect expiry

Two main sources:
	1.	Backend 401/419 responses on client-side requests.
	•	In http/client.ts:
	•	On 401/419 → throw UnauthorizedError with reason: "ExpiredToken".
	•	In ErrorProvider, if it sees reason === "ExpiredToken":
	•	Tell SessionStore → sessionExpired = true.
	2.	Optional idle/expiry timer based on expiry in cookie/claim.
	•	When app boots, read token expiry (from /auth/me or a separate endpoint).
	•	Set a timeout expiresAt - now - skew to mark session as expired, pre-empting 401s.

3.3 UX reaction

SessionProvider subscribes to sessionExpired state and renders SessionExpiredDialog:
	•	Modal with:
	•	“Your session expired”
	•	Continue session button
	•	Sign out button

Continue session:
	•	Calls a backend refresh endpoint (via route handler or direct API).
	•	If refresh succeeds:
	•	Update cookie (server-side).
	•	Reset sessionExpired = false.
	•	Optionally re-run pending requests or reload page.
	•	If fails:
	•	Fall back to sign out.

Sign out:
	•	Call backend logout (optional).
	•	Clear client state.
	•	Hard redirect to /login.

Structurally, all this lives in:
	•	src/lib/http/client.ts (detect 401/419)
	•	src/providers/SessionProvider.tsx
	•	src/components/feedback/SessionExpiredDialog.tsx

…so modules don’t care—they just call APIs.

⸻

4. Unauthorized navigation and errors

You want to handle:
	•	User manually goes to a page they’re not allowed to see.
	•	Or tries to access a tenant they’re not member of.
	•	Or tries an action they’re not allowed to perform.

We tackle it in three layers:

4.1 Route-level guard (SSR) – layouts

In:
	•	app/(platform)/platform/layout.tsx
	•	app/(tenant)/tenant/[tenantSlug]/layout.tsx

We use server code to:
	•	Build RequestContext from cookies + /auth/me.
	•	Check:

requirePlatformAccess(context); // throws / returns redirect
requireTenantAccess(context, tenantSlug);



If authorization fails at layout level:
	•	We can:
	•	Redirect to a global /unauthorized route (e.g. app/unauthorized/page.tsx), or
	•	Render an inline 403 component.

This ensures you never even render platform/tenant content for unauthorized users.

4.2 Page-level or action-level guard

Inside pages/components where more granular permissions matter (e.g. “Manage Tenants” vs just “View Dashboard”), we use:
	•	Hooks or helper functions: hasPermission("platform:manage_tenants").
	•	If the user lacks permission:
	•	Do not render the “Create Tenant” section/button, and
	•	If the entire page is forbidden, either:
	•	Call notFound() (if you want it to look like 404), or
	•	Show a dedicated “You don’t have access to this feature” message.

4.3 API-level guard (backend)

You already know this: this is the real guard. Every API enforces permission/tenant membership. We just ensure the frontend structure always assumes the backend might return 403/404 and has a clean way to react.

⸻

5. Not Found / 404 and incorrect tenant URLs

For full coverage:

5.1 Global 404
	•	app/not-found.tsx – catches:
	•	explicit notFound() calls
	•	non-matching routes.

5.2 Tenant-level 404

In app/(tenant)/tenant/[tenantSlug]/layout.tsx:
	•	When building RequestContext, check whether:
	•	tenantSlug exists at all.
	•	User has membership for that slug.

If tenant does not exist:
	•	Call notFound() → global 404 page shows.

If tenant exists but user not a member:
	•	Return unauthorized page or redirect.

So “random tenant slug” behaves as:
	•	Non-existent slug → 404 (not found)
	•	Real tenant but no membership → 403 (“You’re not allowed”)

5.3 Page not found within tenant

Within tenant routes you can:
	•	Let Next handle unknown subroutes → 404.
	•	Or define tenant-specific not-found.tsx inside [tenantSlug] folder to customize message.

⸻

6. Other scenarios & where they fit in structure

Just to tick off “all other possible scenarios” at the architecture level:
	1.	Backend down / network error
	•	http/client.ts throws NetworkError.
	•	ErrorProvider shows a global banner: “We’re having trouble reaching the server”.
	•	Optionally log to monitoring.
	2.	Global unhandled render errors (bug in React code)
	•	app/error.tsx handles SSR-level.
	•	global-error-boundary.tsx handles client interactions.
	3.	Per-module specific errors
	•	Modules can define more detailed inline errors:
	•	E.g. “This community has no residents yet” vs generic error.
	•	But all HTTP mechanics are shared.
	4.	Soft vs hard navigation
	•	Scope dropdown:
	•	Hard navigation → /platform/dashboard / /tenant/{slug}/dashboard.
	•	Internal navigation inside the same scope:
	•	Client-side <Link> to keep it smooth.
	5.	Last used scope & “resume session”
	•	Optionally store last scope in an HTTP-only cookie (backend) or a secure mechanism.
	•	On login, backend decides where to redirect; frontend just follows.

⸻
