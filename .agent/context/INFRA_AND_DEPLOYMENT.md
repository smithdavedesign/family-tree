# Infrastructure & Deployment

## Environment Variables Flow
This diagram details the flow and purpose of each environment variable in the application, illustrating how they connect the Client, Server, and external services.

```mermaid
graph TD
    subgraph Client ["Frontend (Vercel)"]
        direction TB
        C_SUPA_URL[VITE_SUPABASE_URL] -->|Connects to| Supabase
        C_SUPA_KEY[VITE_SUPABASE_ANON_KEY] -->|Auth & Public Access| Supabase
        C_API[VITE_API_URL] -->|Fetches Data| Server
        C_MOCK[VITE_USE_MOCK] -->|Toggle| MockData[Mock Mode]
    end

    subgraph Server ["Backend (Render)"]
        direction TB
        S_PORT[PORT] -->|Listens on| Port3000
        S_NODE_ENV[NODE_ENV] -->|Configures| AppMode[Production/Dev]
        S_CLIENT[CLIENT_URL] -->|CORS & Redirects| Client
        
        %% Supabase
        S_SUPA_URL[SUPABASE_URL] -->|Connects to| Supabase
        S_SUPA_ANON[SUPABASE_ANON_KEY] -->|Public Access| Supabase
        S_SUPA_SERV[SUPABASE_SERVICE_ROLE_KEY] -->|Admin Access (Bypass RLS)| Supabase

        %% Google
        S_GOOG_ID[GOOGLE_CLIENT_ID] -->|OAuth Init| Google
        S_GOOG_SEC[GOOGLE_CLIENT_SECRET] -->|OAuth Verify| Google
        S_GOOG_API[GOOGLE_API_KEY] -->|Maps/Places API| Google

        %% Stripe
        S_STRIPE_SEC[STRIPE_SECRET_KEY] -->|Create Sessions| Stripe
        S_STRIPE_PUB[STRIPE_PUBLISHABLE_KEY] -->|Client Identification| Stripe
        S_STRIPE_WEB[STRIPE_WEBHOOK_SECRET] -->|Verify Events| StripeWebhook[Stripe Webhooks]
        S_STRIPE_PRICE_M[STRIPE_PRICE_PRO_MONTHLY] -->|Product ID| Stripe
        S_STRIPE_PRICE_Y[STRIPE_PRICE_PRO_YEARLY] -->|Product ID| Stripe
        S_STRIPE_ENV[STRIPE_ENV] -->|Mode| StripeMode[Test/Live]

        %% Email
        S_RESEND[RESEND_API_KEY] -->|Sends Emails| Resend
        S_FROM[NOTIFICATION_FROM_EMAIL] -->|Sender Address| Resend
        
        %% App Logic
        S_FAM_CODE[FAMILY_SECRET_CODE] -->|Validates Grant| GrantLogic
        S_FAM_GRANT[FAMILY_GRANT_AMOUNT] -->|Configures Grant| GrantLogic
        S_MOCK[USE_MOCK] -->|Toggle| ServerMock[Server Mock Mode]
    end

    subgraph External Services
        Supabase[("Supabase DB & Auth")]
        Google[Google Cloud]
        Stripe[Stripe Payments]
        Resend[Resend Email]
    end
```

## Deployment Overview
- **Frontend**: Vercel (Production URL: `https://www.familytree-e.com`)
- **Backend**: Render (API URL: `https://api.familytree-e.com`)
- **Database**: Supabase (PostgreSQL + Auth)
- **Email**: Resend
- **Payments**: Stripe

## Critical Setup Steps

### 1. Database (Supabase)
- Run migrations in `server/sql-prompts/` in sequential order.
- Ensure RLS policies are active on all tables.
- Enable Google OAuth provider and configure site URL settings.

### 2. Backend (Render)
- Deploy the `server/` directory as a Node.js Web Service.
- Important Env Vars:
    - `SUPABASE_SERVICE_ROLE_KEY`: Must be secret (bypasses RLS).
    - `CLIENT_URL`: Must match the frontend URL for CORS and OAuth redirects.
    - `RESEND_API_KEY`: For email notifications.

### 3. Frontend (Vercel)
- Deploy the `client/` directory.
- `VITE_API_URL`: Points to the Render backend service.
- `VITE_USE_MOCK`: Set to `false` for actual data operations.

## Local Development & Docker
The app uses a **self-hosted geocoding service** (Nominatim) for local development to avoid Google API costs.

### Quick Start (Geocoding)
```bash
docker-compose up -d
docker logs -f nominatim # Wait for "Ready"
```
*Note: Do NOT deploy the Nominatim container to production. Set `VITE_GOOGLE_MAPS_API_KEY` instead.*

## Security Checklist
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is not exposed in the client.
- [ ] CORS is restricted to `CLIENT_URL` in the backend.
- [ ] Stripe webhooks are verified using `STRIPE_WEBHOOK_SECRET`.
- [ ] OAuth redirect URIs are whitelisted in both Google and Supabase.
- [ ] Rate limiting is active on the backend.
