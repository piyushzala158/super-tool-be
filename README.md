# Super Tool Backend

Express + SQLite backend for the Super Tool comment widget platform. It manages Google authentication, project ownership, widget access, comment storage, and serves the embeddable `widget.js` script.

## Features

- Google OAuth login flow
- JWT auth stored in an HTTP-only cookie
- SQLite database with automatic table creation on startup
- Authenticated project CRUD endpoints
- Project membership and owner-managed team access
- Session-protected widget and comment access
- Static widget delivery from `/widget.js`
- Basic health check endpoint

## Tech Stack

- Node.js
- Express 4
- better-sqlite3
- JSON Web Tokens
- Google APIs client

## Project Structure

```text
src/
  index.js              Express app entry point
  app/                  App bootstrap, config, middleware
  features/             Auth, projects, comments, widget modules
  shared/db/            SQLite connection and migrations
```

## Prerequisites

- Node.js 18+
- A Google OAuth client configured for local development

## Environment Variables

Create a `.env` file in `backend/` with the following values:

```env
PORT=3001
FRONTEND_URL=http://localhost:5173
JWT_SECRET=replace-with-a-long-random-string
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
COOKIE_SAMESITE=none
COOKIE_SECURE=true
```

### Google OAuth Redirect URI

The backend builds its callback URL from `PORT`, so for local development the redirect URI should be:

```text
http://localhost:3001/auth/google/callback
```

Make sure this exact URL is allowed in your Google Cloud OAuth app settings.

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Or run without nodemon:

```bash
npm start
```

The API will be available at:

```text
http://localhost:3001
```

## Available Scripts

- `npm run dev` starts the server with `nodemon`
- `npm start` starts the server with Node.js

## Database

- The SQLite database file is created at `backend/database.sqlite`
- Tables are created automatically on startup
- Existing databases are lightly migrated on startup for older schema versions

## Authentication

- `GET /auth/google` redirects the user to Google
- `GET /auth/google/callback` exchanges the auth code, creates or updates the user, then sets the `ck_token` cookie
- `GET /api/auth/me` returns the authenticated user from the cookie
- `POST /api/auth/logout` clears the auth cookie
- `GET /api/widget/access?projectId=<id>` checks whether the current logged-in user can use the widget

## API Overview

### Public

- `GET /health`
- `GET /widget.js`

### Authenticated by cookie

- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/widget/access?projectId=<id>`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `DELETE /api/projects/:id`
- `GET /api/projects/:id/members`
- `POST /api/projects/:id/members`
- `DELETE /api/projects/:id/members/:memberUserId`
- `GET /api/comments?projectId=<id>&url=<page-url>`
- `POST /api/comments`
- `PUT /api/comments/:id`
- `DELETE /api/comments/:id`

## Comment Payload

Creating a comment expects:

```json
{
  "pageUrl": "https://example.com/page",
  "xPercent": 42.1,
  "yPercent": 68.4,
  "message": "This section needs clarification",
  "authorName": "Piyush",
  "browser": "Chrome 122",
  "os": "Mac OS 14.4",
  "windowSize": "1440x900",
  "dpr": 2
}
```

All comment endpoints are session-authenticated and require the current user to be a member of the target project.

## Widget

The widget file is served from the repo-level `widget/` directory through:

```text
GET /widget.js
```

The frontend generates a script tag that points to this file with `data-project-id` and `data-api-url`. The widget checks the current session cookie before it renders.

## Notes

- CORS is currently permissive and allows credentialed requests
- For production embeds, use HTTPS with `COOKIE_SAMESITE=none` and `COOKIE_SECURE=true`
- There is currently no automated test script in this package
