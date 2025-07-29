# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SkyTrack is a flight school management platform built with Next.js 15, TypeScript, and Tailwind CSS. The frontend connects to a separate backend API for data management. The application is branded as "Albatross" in the UI.

## Development Commands

- `pnpm dev` - Start development server on port 3001
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `node scripts/clean-airports.js` - Process airport data

## Environment Setup

Required environment variables in `.env.local`:
- `NEXT_PUBLIC_API_URL` - Backend API base URL
- `NEXT_PUBLIC_API_KEY` - API authentication key
- `NEXT_PUBLIC_JWT_TOKEN` - JWT for authentication routes
- `NEXT_PUBLIC_CSRF_TOKEN` - CSRF protection token

## Architecture

### Application Structure
- **App Router**: Uses Next.js App Router with pages in `/app` directory
- **Authentication**: JWT-based with middleware protection for routes
- **Theming**: Dual theme providers (next-themes + Mantine) with light/dark mode
- **State Management**: React hooks with custom data fetchers in `/hooks`
- **Styling**: Tailwind CSS with shadcn/ui components and Mantine integration

### Key Directories
- `/app` - Next.js pages (dashboard, auth, settings, students, instructors, aircraft, schedule)
- `/components` - Reusable React components with shadcn/ui base
- `/hooks` - Custom React hooks for data fetching and state management
- `/types` - TypeScript type definitions
- `/lib` - Utility functions (primarily cn() for className merging)
- `/contexts` - React contexts (background management)

### Protected Routes
Authentication middleware protects these route patterns:
- `/dashboard`, `/settings`, `/account-settings`, `/instructors`, `/students`, `/aircraft`, `/schedule`, `/flight-tracking`

### Component Patterns
- Page components follow naming convention: `{feature}-page.tsx`
- UI components use shadcn/ui primitives with Tailwind styling
- Data fetching uses custom hooks (e.g., `useStatsData`, `useStudentData`)
- Modal components for flight management and settings

### Data Flow
- API calls to backend using fetch with environment variables
- Custom hooks handle data fetching and caching
- Components receive data through props or hook calls
- Statistics and metrics displayed through reusable StatsGrid component

## Key Features
- **Dashboard**: Flight operations overview with real-time tracking map
- **Schedule Management**: Calendar views (daily/weekly/monthly) for flight scheduling
- **Student Management**: Progress tracking, milestones, and individual student pages
- **Instructor Management**: Staff overview and assignment tracking
- **Aircraft Management**: Fleet overview, maintenance tracking, rate management
- **Flight Logging**: Flight entry and history management
- **Settings**: School configuration, user management, and system preferences

## Technical Notes
- Build ignores TypeScript and ESLint errors for faster development
- Images are unoptimized for deployment flexibility
- Custom port handling through environment variables
- Login route redirects to `/auth/login` automatically
- Authentication supports both cookie and header-based tokens