# Environment Variable Flow

This document details the flow and purpose of each environment variable in the application, illustrating how they connect the Client, Server, and external services (Supabase, Stripe, Google, Resend).

```mermaid
graph TD
    subgraph Client [Frontend (Vercel)]
        direction TB
        C_SUPA_URL[VITE_SUPABASE_URL] -->|Connects to| Supabase
        C_SUPA_KEY[VITE_SUPABASE_ANON_KEY] -->|Auth & Public Access| Supabase
        C_API[VITE_API_URL] -->|Fetches Data| Server
        C_MOCK[VITE_USE_MOCK] -->|Toggle| MockData[Mock Mode]
    end

    subgraph Server [Backend (Render)]
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
        Supabase[(Supabase DB & Auth)]
        Google[Google Cloud]
        Stripe[Stripe Payments]
        Resend[Resend Email]
    end
```

## Detailed Explanations

### Client Variables (`client/.env`)

These variables are bundled with the frontend code. **They are visible to anyone inspecting the code.**

| Variable | Purpose |
| :--- | :--- |
| `VITE_SUPABASE_URL` | The URL of your Supabase project. Used by the Supabase client to connect. |
| `VITE_SUPABASE_ANON_KEY` | The public "anonymous" key for Supabase. Safe to expose. Used for public RLS policies. |
| `VITE_API_URL` | The URL of your Backend API (e.g., `https://api.familytree-e.com`). The frontend sends requests here. |
| `VITE_USE_MOCK` | If `true`, the app uses fake data instead of calling the API. Useful for development. |

### Server Variables (`server/.env`)

These variables are kept **secret** on the server. Never expose these in the client.

| Variable | Purpose | Security Level |
| :--- | :--- | :--- |
| `PORT` | The port the server listens on (default: 3000). | Low |
| `NODE_ENV` | `production` or `development`. Optimizes builds and logging. | Low |
| `clients` / `CLIENT_URL` | The URL of your Frontend (e.g., `https://www.familytree-e.com`). Used for CORS (security) and OAuth redirects. | Low |
| **Supabase** | | |
| `SUPABASE_URL` | Connects backend to database. | Low |
| `SUPABASE_ANON_KEY` | Used for basic requests. | Low |
| `SUPABASE_SERVICE_ROLE_KEY` | **CRITICAL SECRET.** Bypasses all Row Level Security. Allows backend to do anything. | **HIGH** |
| **Google** | | |
| `GOOGLE_CLIENT_ID` | Identifies app for OAuth login. | Low |
| `GOOGLE_CLIENT_SECRET` | Authenticates app for OAuth token exchange. | **HIGH** |
| `GOOGLE_API_KEY` | Used for Google Maps/Places API calls. | Medium (Restrict usage in Console) |
| **Stripe** | | |
| `STRIPE_SECRET_KEY` | Authenticates backend to create payment sessions. | **HIGH** |
| `STRIPE_PUBLISHABLE_KEY` | Passed to frontend to load Stripe Elements. | Low |
| `STRIPE_WEBHOOK_SECRET` | Verifies that incoming webhooks are actually from Stripe. | **HIGH** |
| `STRIPE_PRICE_...` | ID of the products in Stripe dashboard. | Low |
| `STRIPE_ENV` | `test` or `live`. Determines which Stripe mode to use. | Low |
| **App Logic** | | |
| `FAMILY_SECRET_CODE` | A secret password users can enter to bypass payment (for family members). | **HIGH** |
| `FAMILY_GRANT_AMOUNT` | The value given when the secret code is used. | Low |
| **Email** | | |
| `RESEND_API_KEY` | Authenticates with Resend to send emails. | **HIGH** |
| `NOTIFICATION_FROM_EMAIL`| The email address notifications appear to come from (e.g., `notifications@familytree-e.com`). | Low |
