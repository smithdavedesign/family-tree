---
description: Expert knowledge and procedures for the Roots & Branches Family Tree application.
---

# Skill: Family Tree Expert

This skill provides specialized knowledge for working on the "Roots & Branches" application.

## 1. Domain Knowledge

### Genealogy Data Model
-   **Person**: The core entity. Includes `birth_date`, `death_date`, `locations`, and `parents`.
-   **Relationship**: Strictly modeled as:
    -   `parent_child`: Directional (Person 1 is parent of Person 2).
    -   `spouse`: Non-directional (effectively), but stored as a record.
    -   **Important**: Infinite loops in the graph are possible but blocked by validation logic.

### Tree Visualization (React Flow)
-   **Nodes**: Custom components in `client/src/components/TreeVisualizer`.
-   **Layout**: Uses `dagre` for automatic hierarchical layout.
    -   `TB` (Top-Bottom) usually, but users can toggle `LR` (Left-Right).
-   **Performance**: Large trees (>200 nodes) use virtualization and simplified rendering modes.

## 2. Troubleshooting Procedures

### "Google Photos Not Loading"
1.  Check `google_connections` table for the user.
2.  Verify `refresh_token` exists.
3.  Check if token is expired (auto-refresh logic in `server/controllers/googleOAuthController.js`).
4.  **Common Cause**: User revoked access or App is in "Testing" mode on GCP and token expired > 7 days.

### "Supabase 401 Unauthorized"
1.  Check the `Authorization` header in the request.
2.  Verify the JWT is not expired.
3.  Ensure the `VITE_SUPABASE_ANON_KEY` matches the backend project.

### "React Flow Node overlap"
1.  Check `getLayoutElements` in `TreeVisualizer.jsx`.
2.  Verify `nodeWidth` and `nodeHeight` constants match the actual rendered CSS size.

## 3. Development Workflows

### Creating a New Migration
1.  Do NOT modify `schema.sql` directly for production apps.
2.  Create a new file in `server/sql-prompts/` named `XXX_description.sql`.
3.  Apply it via Supabase SQL Editor.
4.  Update `docs/DATABASE.md` (if it exists) or `README.md`.

### Adding a New API Route
1.  Define the route in `server/routes/api.js`.
2.  Create the controller in `server/controllers/`.
3.  **CRITICAL**: Add `auditLog('ACTION', 'resource')` middleware.
4.  **CRITICAL**: Add `writeLimiter` for POST/PUT/DELETE.

## 4. Testing
-   Run `npm test` in `client/` for unit/integration.
-   Run `npm test:e2e` for Playwright flows.
-   **Mocking**: Use `client/src/utils/testUtils.jsx` to render components with required Providers (Auth, Toast, etc.).
