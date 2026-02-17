---
description: Run an automated end-to-end login test on the local development server.
---

# Workflow: Test Login Flow

This workflow automates the process of testing the Google SSO login flow. It uses the `login_automation` skill and browser subagent.

## Steps

1. **Verify Server**: Ensure the local development server is running on `http://localhost:4173`.
2. **Execute Login**: Use the `browser_subagent` to perform the login sequence:
    - Navigate to `http://localhost:4173/login`.
    - Click "Sign in with Google".
    - Authenticate with `1426davejobs@gmail.com`.
    - Follow the "Continue" redirects (X2).
    - Select "Demo Family Tree".
3. **Validation**: Capture a screenshot once the tree canvas is visible to confirm success.

// turbo
4. Run the browser subagent with the following task:
   "Log into http://localhost:4173/login using 1426davejobs@gmail.com. Complete the Google OAuth redirects by clicking 'Continue' twice. Finally, click on 'Demo Family Tree' and verify the React Flow canvas is rendered."
