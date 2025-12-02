# SAVI Portal

Modern Next.js frontend for the SAVI community management platform.

## Tech Stack

- **Next.js 14** - App Router, React Server Components
- **TypeScript** - Type-safe code
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Firebase Auth** - Client-side authentication
- **Zustand** - Lightweight state management

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project configured

### Installation

1. Clone the repository and navigate to the portal directory:

```bash
cd savi-portal
```

2. Install dependencies:

```bash
npm install
```

3. Create environment file:

```bash
cp .env.local.example .env.local
```

4. Configure your `.env.local` with:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000

# Firebase Configuration (from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

5. Start the development server:

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
savi-portal/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Auth pages (login, reset-password)
│   │   ├── (platform)/         # Platform admin pages
│   │   ├── (tenant)/           # Tenant-scoped pages
│   │   └── account/            # Account pages (profile)
│   ├── components/
│   │   ├── ui/                 # Radix-based UI primitives
│   │   ├── layout/             # Layout components (TopBar, SideNav, etc.)
│   │   └── feedback/           # Toasts, dialogs, loaders
│   ├── lib/
│   │   ├── auth/               # Firebase auth utilities
│   │   ├── http/               # HTTP client with error handling
│   │   ├── store/              # Zustand stores
│   │   └── utils/              # Utility functions
│   ├── config/                 # Environment & route config
│   ├── providers/              # React context providers
│   └── types/                  # TypeScript types
├── middleware.ts               # Edge middleware
└── tailwind.config.ts          # Tailwind configuration
```

## Key Features

### Authentication Flow

1. User opens app → redirected to `/login`
2. Signs in with Firebase (email/password)
3. App calls `/auth/me` to get roles & tenant memberships
4. Redirected to appropriate dashboard based on roles:
   - Platform Admin → `/platform/dashboard`
   - Tenant User → `/tenant/{slug}/dashboard`

### Scope Switching

Gmail-style scope dropdown in the header:
- Platform Admins see "Platform" + all tenants
- Tenant users see only their tenants
- Switching scopes triggers a hard navigation (full page reload)

### Profile & Logout

- `/account/profile` - View profile and access overview
- User menu with "Sign Out" option
- Clears Firebase auth + local storage
- Redirects to `/login`

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Backend API

The portal expects these endpoints from the backend:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/platform/auth/me` | GET | Get current user info, roles, memberships |
| `/api/v1/platform/auth/logout` | POST | Backend logout (for audit) |
| `/api/v1/platform/me/profile` | GET | Get user profile |

## Contributing

1. Follow the existing code patterns
2. Use descriptive component and function names
3. Add comments for complex logic
4. Keep files under 500 lines

