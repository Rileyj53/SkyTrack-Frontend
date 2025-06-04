# SkyTrack Frontend

This repository contains the front‑end of **SkyTrack**, a Next.js application written in TypeScript. It uses Tailwind CSS for styling and relies on API calls to a separate backend service.

## Setup

1. Ensure you have **Node.js 18+** installed.
2. Install dependencies using your preferred package manager. This project was created with [pnpm](https://pnpm.io/), but `npm` and `yarn` also work.

```bash
pnpm install
```

## Running the project

To start the development server run:

```bash
pnpm dev
```

The server runs on port `3001` by default (see `package.json`). You can change the port by setting the `PORT` environment variable.

For a production build use:

```bash
pnpm build
pnpm start
```

## Required environment variables

Create a `.env.local` file in the project root and provide the following variables. They are required for API requests and authentication:

```bash
NEXT_PUBLIC_API_URL= # Base URL of the SkyTrack API
NEXT_PUBLIC_API_KEY= # API key used in request headers
NEXT_PUBLIC_JWT_TOKEN= # JWT token used by the /api/auth/set-cookies route
NEXT_PUBLIC_CSRF_TOKEN= # CSRF token used by the /api/auth/set-cookies route
```

The development scripts also honour `PORT` if you need a custom port.

## Additional information

- Source code for pages resides in the `app` directory (Next.js App Router).
- UI components live in the `components` folder and are styled with Tailwind CSS.
- Linting is provided via `npm run lint` (requires dependencies to be installed).

Feel free to fork or contribute!

