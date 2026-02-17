# Domain Migration Checklist: `familytree-e.com`

This checklist details the specific steps to migrate the "Roots & Branches" application to the new domain.

## 1. Domain Configuration (GoDaddy & DNS)
- [x] **Frontend Domain**: `familytree-e.com` (and `www.familytree-e.com`)
    - Points to Vercel (`76.76.21.21`).
    - Status: **Verified** (Vercel).
- [x] **Backend Domain**: `api.familytree-e.com`
    - Points to Render (`family-tree-api.onrender.com`).
    - Status: **Verified** (Render).

## 2. Environment Variables (.env)
Update these on your production servers to ensuring the apps can communicate.

### Render (Backend)
- [ ] **CLIENT_URL**: Set to `https://www.familytree-e.com`
    - *Crucial for CORS (allowing frontend requests) and Auth Redirects.*
- [ ] **NOTIFICATION_FROM_EMAIL**: Set to `notifications@familytree-e.com`
    - *Ensures emails come from your domain.*

### Vercel (Frontend)
- [ ] **VITE_API_URL**: Set to `https://api.familytree-e.com`
    - *Tells the frontend where to send API requests.*
- [ ] **VITE_SUPABASE_URL** & **VITE_SUPABASE_ANON_KEY**: Ensure these are set (no change needed).

## 3. Resend (Email Service)
- [x] **Add Domain**: Added `contact.familytree-e.com` in Resend Dashboard.
- [x] **DNS Records**: Added MX, SPF, and DKIM records for `contact.familytree-e.com` to GoDaddy.
- [ ] **Verify**: Click "Verify DNS" in Resend (if not already verified).
- [ ] **API Key**: Update `RESEND_API_KEY` in Render if you generated a new one.

### Render Environment Variables
- [ ] **NOTIFICATION_FROM_EMAIL**: Set to `notifications@contact.familytree-e.com` (or `support@contact.familytree-e.com`)
    - *Using the subdomain improves deliverability.*

## 4. Google API Console (OAuth & Pickers)
Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials).

- [ ] **Authorized JavaScript Origins**: Add `https://www.familytree-e.com`
    - *Required for the "Sign in with Google" popup.*
- [ ] **Authorized Redirect URIs**:
    - Ensure `https://<your-project>.supabase.co/auth/v1/callback` is present.
    - *Note:* Since we use Supabase Auth, the redirect usually goes to Supabase first, but check if you have any direct Google integrations.
- [ ] **Verification**: If you are using sensitive scopes (Drive/Photos), you may need to update the domain in the "OAuth Consent Screen" settings.

## 5. Supabase
Go to [Supabase Dashboard](https://supabase.com/dashboard) -> Authentication -> URL Configuration.

- [ ] **Site URL**: Update to `https://www.familytree-e.com`
    - *This is the default redirect for magic links and OAuth.*
- [ ] **Redirect URLs**: Add `https://www.familytree-e.com/**`
    - *Allows deep linking for auth callbacks.*
- [ ] **Email Templates**: Update "Confirm Signup" and "Reset Password" templates to use `{{ .SiteURL }}` or hardcode `https://www.familytree-e.com`.

## 6. Stripe (Payments)
- [ ] **Webhook Endpoint**: Create/Update webhook to `https://api.familytree-e.com/api/webhooks/stripe`
    - *Select events:* `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted`.
- [ ] **Branding**: Update Business Settings in Stripe Dashboard with `https://www.familytree-e.com`.

## 7. Verification Steps
After updating everything above:

1.  **Frontend Load**: Visit `https://www.familytree-e.com`. ensure it loads.
2.  **API Check**: detailed check.
    - Open Network Tab in browser.
    - Refresh page.
    - Look for requests to `api.familytree-e.com`. Ensure they are 200 OK.
3.  **Login**: Try logging in with Google.
4.  **Email**: Trigger an action (like a comment) and check if email arrives from `notifications@familytree-e.com`.
