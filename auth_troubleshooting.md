# Google Auth Troubleshooting

If clicking "Sign in with Google" doesn't work, please check the following configuration in your Supabase and Google Cloud dashboards.

## 1. Supabase Dashboard Configuration
1. Go to **Authentication > Providers** in Supabase.
2. Ensure **Google** is **Enabled**.
3. Verify you have entered the **Client ID** and **Client Secret** from Google Cloud.
4. **Crucial:** Check the **Redirect URLs** under **Authentication > URL Configuration**.
   - You must add `http://localhost:5173` (or your current local URL) to the **Site URL** or **Redirect URLs** list.
   - If this is missing, Supabase won't allow the redirect after login.

## 2. Google Cloud Console Configuration
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your project.
3. Go to **APIs & Services > Credentials**.
4. Edit your **OAuth 2.0 Client ID**.
5. Check **Authorized redirect URIs**.
   - It **MUST** match the "Callback URL (for OAuth)" found in your Supabase Google Provider settings.
   - Format: `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - It should **NOT** be `localhost`.

## 3. Google Photos API
1. In Google Cloud Console, go to **APIs & Services > Enabled APIs & services**.
2. Click **+ ENABLE APIS AND SERVICES**.
3. Search for **"Photos Library API"**.
4. Enable it.
5. **Note:** If your app is in "Testing" mode in the OAuth Consent Screen, you must add your own email address as a **Test User**.

## 4. Browser Console
- Open the Developer Tools (F12) -> Console.
- Click the sign-in button.
- Look for any red error messages.
