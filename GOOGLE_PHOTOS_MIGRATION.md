# Google Photos Picker API Migration

## What Changed

Google is deprecating the old `photoslibrary.readonly` scope by **March 31, 2025**. We've updated the app to use the new Photos Picker API scope.

### Old Scope (Deprecated)
```javascript
scopes: 'https://www.googleapis.com/auth/photoslibrary.readonly'
```

### New Scope (Current)
```javascript
scopes: 'https://www.googleapis.com/auth/photospicker.mediaitems.readonly'
```

## What This Means

1. **Same API Endpoint**: The `photoslibrary.googleapis.com/v1/mediaItems` endpoint still works
2. **Different Permissions**: The new scope is more restrictive - it's designed for "picker" use cases
3. **Requires OAuth Verification**: Google requires app verification for production use

## Required Steps for Production

### 1. Update Supabase Configuration

In your Supabase Dashboard:
1. Go to **Authentication** → **Providers** → **Google**
2. Ensure your Google Cloud OAuth Client ID and Secret are configured
3. The scopes are now handled in the code, not in Supabase UI

### 2. Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **OAuth consent screen**
3. Add the new scope:
   - Click "Add or Remove Scopes"
   - Search for: `https://www.googleapis.com/auth/photospicker.mediaitems.readonly`
   - Add it to your scopes list
4. **Important**: You may need to submit for OAuth verification if you haven't already

### 3. Verify Redirect URIs

In **APIs & Services** → **Credentials** → Your OAuth 2.0 Client:
- Ensure this redirect URI is added:
  ```
  https://[your-supabase-project-ref].supabase.co/auth/v1/callback
  ```

### 4. Test the Flow

1. **Sign out** of your app completely
2. **Clear browser localStorage**: 
   - Open DevTools (F12)
   - Application → Local Storage → Clear All
3. **Sign in again** with Google
4. You should see a consent screen asking for Google Photos Picker access
5. Grant permission
6. Try "Add Photos" - it should now work

## Troubleshooting

### "Unverified App" Warning
During development, you'll see an "unverified app" warning. This is normal.
- Click "Advanced" → "Go to [Your App Name] (unsafe)"
- For production, you must complete Google's OAuth verification process

### Still No Provider Token
If you still don't get a `provider_token` after signing in:

1. **Check the session after login**:
   ```javascript
   const { data: { session } } = await supabase.auth.getSession();
   console.log('Provider token:', session?.provider_token);
   ```

2. **Verify OAuth parameters**:
   - `access_type: 'offline'` - ensures refresh token
   - `prompt: 'consent'` - forces consent screen on first login

3. **Check Supabase logs**:
   - Go to Supabase Dashboard → Logs
   - Look for authentication errors

### API Returns 401 Unauthorized
- The token might be expired
- Try refreshing: `await supabase.auth.refreshSession()`
- If still failing, user needs to re-authenticate

## Code Changes Made

### `/client/src/auth.js`
- Updated `signInWithGoogle()` to use new Photos Picker API scope
- Added better error logging
- Ensured `access_type: 'offline'` and `prompt: 'consent'` are set

### `/client/src/components/PhotoPicker.jsx`
- No changes needed - API endpoint remains the same
- Error handling already in place for re-authentication

### `/client/src/utils/sessionManager.js`
- Already saves `provider_token` correctly
- No changes needed

## Next Steps

1. **Deploy these changes**
2. **Sign out and clear localStorage**
3. **Sign in again** - you should see the new consent screen
4. **Test photo picker** - should now work with the new scope

## References

- [Google Photos Picker API Documentation](https://developers.google.com/photos/picker/guides)
- [Supabase OAuth Scopes Documentation](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth Verification Process](https://support.google.com/cloud/answer/9110914)
