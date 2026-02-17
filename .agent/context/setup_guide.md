# Agent Setup Guide

## Quick Start
1.  **Read Context**: Start by reading `.agent/context/project_overview.md` and `docs/ARCHITECTURE.md`.
2.  **Check Environment**:
    -   Frontend: `client/.env` (Vite vars)
    -   Backend: `server/.env` (Service keys, DB URL)
3.  **Run Locally**:
    -   Backend: `cd server && npm run dev` (Port 3000)
    -   Frontend: `cd client && npm run dev` (Port 5173)

## Common Tasks for Agents
-   **Adding a Feature**:
    1.  Update `server/sql-prompts/schema.sql` (or create new migration).
    2.  Update `server/routes/api.js` and controllers.
    3.  Create frontend component in `client/src/components`.
    4.  Add route in `client/src/App.jsx`.
-   **Debugging**:
    -   Check `server/logs` (if file logging enabled) or console.
    -   Use `logger.info` for tracing.

## "Gotchas"
-   **Google 403**: Usually means the App is not verified or the user is not a test user in GCP.
-   **Tailwind not applying**: Ensure `content` path in `tailwind.config.js` covers your new file.
-   **Supabase RLS**: If a query returns empty array `[]` but data exists, it's 99% an RLS policy issue.
