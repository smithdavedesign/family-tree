# Key Conventions & Patterns

## Coding Standards

### Frontend (React/Vite)
-   **Styling**: Use **Tailwind CSS v3** exclusively. Avoid inline styles or separate CSS files unless absolutely necessary for complex animations.
    -   *Good*: `className="flex items-center justify-center p-4"`
    -   *Bad*: `style={{ display: 'flex', ... }}`
-   **State**: Use `React Context` for global state (User, Toast, Search) and `React Query` (TanStack Query) for server state.
-   **Components**: Functional components only. Use named exports.
-   **File Structure**: Group by feature/page where possible. `src/components` for shared UI, `src/pages` for routes.

### Backend (Node/Express)
-   **Architecture**: Controller-Service-Model pattern (though Model is effectively Supabase).
-   **Auth**: Always use `req.user` attached by `requireAuth` middleware.
-   **Validation**: Use `Joi` schemas for all input validation (in `middleware/validation.js`).
-   **Error Handling**: specific middleware `utils/errorLogger.js`. Do not just `console.error`; use `logger.error()`.

### Database (Supabase)
-   **Access**: Use Row Level Security (RLS) for all tables.
-   **Client**: Use the `supabase` client from `utils/supabaseClient.js`.
-   **Migrations**: SQL files in `server/sql-prompts`.

## Critical Patterns
1.  **Dual OAuth**: Never try to use the login token for Google Drive/Photos API. Check `google_connections` table for the correct refresh token.
2.  **Mock Mode**: If `USE_MOCK=true` is set (or VPN issues arise), the app uses `src/mockSupabase.js`. Be aware of this when debugging "missing data".
3.  **Optimistic Updates**: The UI should update immediately. Revert on error.
