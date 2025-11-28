# Google Photos Integration Debug Checklist

## Current Status
✅ Error state is being set correctly to `'REAUTH_NEEDED'`
✅ Console logs confirm the flow is working as expected
❓ Re-auth button visibility needs verification

## Diagnostic Steps

### 1. **Verify UI Rendering** (IMMEDIATE)
After the latest update, when you click "Add Photos", check the console for:
```
Rendering REAUTH_NEEDED UI
```

**Expected**: This log should appear right after `PhotoPicker error state changed: REAUTH_NEEDED`

**If you see this log**: The button IS rendering, but might be hidden by CSS/layout issues
**If you DON'T see this log**: There's a conditional rendering issue

---

### 2. **Check Browser DevTools Elements** (IF BUTTON NOT VISIBLE)
1. Open browser DevTools (F12 or Cmd+Option+I)
2. Click "Add Photos" button
3. In the Elements/Inspector tab, search for text: "Re-authenticate with Google"
4. Check if the button element exists in the DOM

**If element exists but not visible**:
- Check for `display: none` or `visibility: hidden` styles
- Check if parent container has `overflow: hidden`
- Check z-index conflicts

**If element doesn't exist**:
- The conditional rendering is failing
- Check if there's a different error value being set

---

### 3. **Verify Supabase Configuration** (ROOT CAUSE)
The real issue is that `provider_token` is missing. This happens when:

#### A. Google OAuth Scopes Not Configured
**Check in Supabase Dashboard**:
1. Go to Authentication → Providers → Google
2. Verify "Scopes" includes: `https://www.googleapis.com/auth/photoslibrary.readonly`
3. Verify "Access Type" is set to `offline` (to get refresh tokens)

#### B. User Never Granted Photo Library Permission
**Solution**: User needs to:
1. Sign out completely
2. Sign in again
3. When Google OAuth consent screen appears, ensure "Google Photos" permission is checked
4. Click "Allow"

#### C. Refresh Token Not Being Stored
**Check**:
1. After signing in with Google, open DevTools → Application → Local Storage
2. Look for a key like `sb-[project-id]-auth-token`
3. Expand it and verify `provider_refresh_token` exists
4. If missing, Supabase isn't receiving the refresh token from Google

---

### 4. **Test the Re-auth Flow** (ONCE BUTTON IS VISIBLE)
1. Click "Re-authenticate with Google Photos"
2. Should redirect to Google OAuth consent screen
3. Grant permissions (make sure Google Photos is checked)
4. Should redirect back to your app
5. Modal should close and reopen with photos

**Expected Console Logs**:
```
Re-authenticating with Google...
[Google OAuth redirect happens]
[After redirect back]
Attempting to refresh session for Google Photos...
Provider token from refresh: Found
```

---

### 5. **Verify Session Manager** (IF TOKEN STILL MISSING AFTER RE-AUTH)
Check `sessionManager.js` is properly saving the `provider_token`:

**Current Implementation** (should be correct):
```javascript
sessionManager.saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    provider_token: session.provider_token,  // ✅ This should be here
    expires_at: session.expires_at,
    user: session.user
  }));
}
```

---

## Quick Fixes to Try

### Fix 1: Force Re-authentication
1. Sign out of the app
2. Clear browser localStorage (DevTools → Application → Local Storage → Clear All)
3. Sign in again with Google
4. When prompted, ensure you grant Google Photos access
5. Try "Add Photos" again

### Fix 2: Check Supabase Project Settings
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Verify "Site URL" matches your production URL
3. Add your production URL to "Redirect URLs"

### Fix 3: Verify Google Cloud Console
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Find your OAuth 2.0 Client ID
3. Verify "Authorized redirect URIs" includes your Supabase callback URL:
   ```
   https://[your-project-ref].supabase.co/auth/v1/callback
   ```
4. Verify "Scopes" includes Google Photos Library API

---

## Expected Working Flow

### Initial Sign-In
```
1. User clicks "Sign in with Google"
2. Redirects to Google OAuth consent screen
3. User grants permissions (including Google Photos)
4. Google returns authorization code + refresh token
5. Supabase exchanges code for tokens
6. Session saved with provider_token
7. User redirected back to app
```

### Subsequent Photo Access
```
1. User clicks "Add Photos"
2. PhotoPicker tries to get provider_token from:
   a. Supabase session (via refreshSession)
   b. Current session (via getSession)
   c. SessionManager (localStorage)
3. If found: Fetch photos from Google Photos API
4. If not found: Show re-auth button
```

---

## Next Steps

1. **Deploy the latest changes** (with the new console log)
2. **Test and report back**:
   - Do you see "Rendering REAUTH_NEEDED UI" in console?
   - Can you see the re-auth button in the UI?
   - If not visible, inspect the DOM - does the button element exist?

3. **If button is visible and you click it**:
   - Does it redirect to Google?
   - Do you see the Google Photos permission in the consent screen?
   - After granting permission, does it work?

4. **If still not working after re-auth**:
   - Check Supabase logs for any errors
   - Verify Google Cloud Console configuration
   - Check if `provider_token` is in the session after sign-in
