# Environment Variables Explained

You are validly confused! Here is the breakdown:

## 1. Render (Backend)
In your screenshot, I see **`CLIENT_URL`**.
- This is a variable **YOU** set in Render.
- It tells your backend "Who is allowed to talk to me?".
- Currently, it points to `https://family-tree-blue-kappa.vercel.app/`.
- **Action:** Change it to `https://www.familytree-e.com`.

## 2. Vercel (Frontend)
Your screenshot shows Render, but you **ALSO** have a Vercel project by the same name or similar.
Your Frontend code (React) runs in the browser, served by Vercel.
It needs to know "Where do I send API requests?".

- This is controlled by **`VITE_API_URL`**.
- This variable lives **IN VERCEL**, not Render.
- **Action:**
    1.  Go to [Vercel Dashboard](https://vercel.com/dashboard).
    2.  Select your project.
    3.  Settings -> Environment Variables.
    4.  Add/Edit `VITE_API_URL`.
    5.  Value: `https://api.familytree-e.com`.
    6.  **Redeploy** your frontend.

## Why two places?
- **Render** has the database keys (`SUPABASE_...`).
- **Vercel** has the API location (`VITE_API_URL`).
They are separate systems and need to point to each other.
