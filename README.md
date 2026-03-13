# Super Tool Backend

Express + SQLite backend for the Super Tool comment widget platform. It manages Google authentication, project ownership, widget access, comment storage, and serves the embeddable `widget.js` script.

## Features

- Google OAuth login flow
- JWT auth stored in an HTTP-only cookie
- SQLite database with automatic table creation on startup
- Authenticated project CRUD endpoints
- API-key-protected comment write/update/delete endpoints
- Public comment fetch endpoint
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
  db.js                 SQLite setup and lightweight migrations
  middleware/
    requireAuth.js      Cookie/JWT auth guard
  routes/
    auth.js             Google auth and session endpoints
    projects.js         Protected project routes
    comments.js         Comment API routes
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
- `GET /api/auth/verify-widget` checks whether a user owns a project before showing the widget

## API Overview

### Public

- `GET /health`
- `GET /api/comments?projectId=<id>&url=<page-url>`
- `GET /api/auth/verify-widget?userId=<id>&projectId=<id>`
- `GET /widget.js`

### Authenticated by cookie

- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `DELETE /api/projects/:id`

### Protected by `x-api-key`

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

Requests that create, update, or delete comments must include:

```text
x-api-key: your-project-api-key
```

## Widget

The widget file is served from the repo-level `widget/` directory through:

```text
GET /widget.js
```

The frontend generates a script tag that points to this file and includes project metadata through `data-*` attributes.

## Notes

- CORS is currently permissive and allows credentialed requests
- Auth cookies are configured for local development with `secure: false`
- There is currently no automated test script in this package
