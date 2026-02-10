# Voyage - Bus & Ferry Booking Platform

## Overview

Voyage (branded as BUSPLUS) is a travel booking platform for bus and ferry services in Uruguay and Argentina. Users can search for trips between cities, view schedules and prices, make bookings, and earn loyalty miles. The application supports both guest bookings and authenticated user experiences with features like booking history and miles tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **Styling**: Tailwind CSS v4 with shadcn/ui component library (New York style)
- **Build Tool**: Vite with custom plugins for Replit integration
- **Animation**: Framer Motion for page transitions and micro-interactions

The frontend follows a page-based structure with shared components:
- Pages: Home (search), Results (trip listings), My Bookings, My Miles
- Components organized by feature (booking/, layout/, ui/)
- Custom hooks for authentication and responsive design

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful endpoints under `/api/` prefix
- **Authentication**: Replit Auth (OpenID Connect) with Passport.js
- **Session Management**: PostgreSQL-backed sessions via connect-pg-simple

Key API endpoints:
- `/api/trips` - Search and filter trips
- `/api/bookings` - Create and manage bookings
- `/api/auth/user` - Current user information
- `/api/miles` - User loyalty program data

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` for shared types between client/server
- **Tables**: operators, trips, bookings, users, sessions, userMiles, milesTransactions

The storage layer (`server/storage.ts`) implements an interface pattern for data access, supporting trip searches with filters, booking management, and miles tracking.

### Authentication
- Replit Auth integration using OpenID Connect
- Session-based authentication with PostgreSQL session store
- Protected routes use `isAuthenticated` middleware
- User data synced to local users table on login

### Build & Deployment
- Development: Vite dev server with HMR, Express API server via tsx
- Production: Vite builds client to `dist/public`, esbuild bundles server to `dist/index.cjs`
- Database migrations via Drizzle Kit (`db:push` command)

## External Dependencies

### Database
- PostgreSQL (required, connection via `DATABASE_URL` environment variable)
- Drizzle ORM for type-safe database queries
- connect-pg-simple for session storage

### Authentication
- Replit Auth (OpenID Connect provider)
- Requires `ISSUER_URL`, `REPL_ID`, and `SESSION_SECRET` environment variables

### UI Components
- shadcn/ui component library (Radix UI primitives)
- Lucide React for icons
- date-fns for date formatting with Spanish locale support

### Third-Party Services
- No external payment processing currently implemented
- No email/notification services configured
- Miles/loyalty system is internal calculation based on bookings