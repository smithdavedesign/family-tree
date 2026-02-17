# Render Domain Setup (Backend)

Since your main domain (`familytree-e.com`) is now pointing to Vercel (Frontend), you **cannot** use it for Render (Backend) too. It would break your website.

Instead, you should use a **subdomain** for your API, like `api.familytree-e.com`.

## 1. Add Domain in Render
1.  In the "Add Custom Domain" modal you are looking at:
    - **Enter:** `api.familytree-e.com`
2.  Click **Add Domain**.

## 2. Get DNS Info
Render will now show you instructions. It will likely ask for:
- **Type:** `CNAME`
- **Name:** `api`
- **Value:** `family-tree-api.onrender.com` (or similar)

## 3. Go to GoDaddy
1.  Click **Add New Record**.
2.  **Type:** `CNAME`
3.  **Name:** `api`
4.  **Value:** Copy the value from Render (e.g., `family-tree-api.onrender.com`).
5.  **TTL:** Default.
6.  Click **Save**.

## 4. Verify
1.  Go back to Render and verify.
2.  Once verified, your API will be accessible at `https://api.familytree-e.com`.

## 5. Update Environment Variables (IMPORTANT)
After this changes, you need to update your **Frontend (Vercel)** and **Backend (Render)** configuration:

1.  **In Vercel (Project Settings -> Environment Variables):**
    - Update `VITE_API_URL` to `https://api.familytree-e.com`.
    - Redeploy the frontend.

2.  **In Render (Environment):**
    - Update `CLIENT_URL` to `https://www.familytree-e.com` (if not already done).
