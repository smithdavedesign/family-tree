# Sentry Configuration

## Overview
Sentry is configured for both frontend and backend error tracking, performance monitoring, and session replay.

## Environment Variables

### Frontend (.env)
```env
VITE_SENTRY_DSN=your_sentry_dsn_here
```

### Backend (.env)
```env
SENTRY_DSN=your_sentry_dsn_here
NODE_ENV=production
```

## Features

### Frontend
- **Error Tracking:** Automatic capture of unhandled errors
- **Performance Monitoring:** 10% sample rate in production
- **Session Replay:** 10% of sessions, 100% of error sessions
- **Data Filtering:** Removes tokens, passwords, and sensitive headers
- **Breadcrumbs:** Tracks user actions for debugging

### Backend
- **Error Tracking:** Captures all 500+ status code errors
- **Performance Monitoring:** Request tracing
- **Data Filtering:** Removes authorization headers and sensitive query params
- **User Context:** Tracks user ID and email (when available)

## Usage

### Frontend

```javascript
import { captureException, captureMessage, setUser, addBreadcrumb } from './utils/sentry';

// Capture an exception
try {
  // risky operation
} catch (error) {
  captureException(error, { context: 'additional info' });
}

// Capture a message
captureMessage('Something important happened', 'info', { userId: '123' });

// Set user context
setUser({ id: user.id, email: user.email });

// Add breadcrumb
addBreadcrumb('User clicked button', 'ui', { buttonId: 'submit' });
```

### Backend

```javascript
const { captureException, captureMessage, setUser } = require('./utils/sentry');

// Capture an exception
try {
  // risky operation
} catch (error) {
  captureException(error, { context: 'additional info' });
}

// Capture a message
captureMessage('Database connection established', 'info');

// Set user context
setUser({ id: user.id, email: user.email });
```

## Setup Instructions

1. **Create Sentry Account:**
   - Go to https://sentry.io
   - Create a new project for React (frontend)
   - Create a new project for Node.js (backend)

2. **Get DSN:**
   - Copy the DSN from project settings
   - Add to `.env` files (frontend and backend)

3. **Test Integration:**
   ```javascript
   // Frontend: Add to a component
   throw new Error('Test Sentry Error');
   
   // Backend: Add to a route
   throw new Error('Test Sentry Error');
   ```

4. **Verify:**
   - Check Sentry dashboard for errors
   - Verify data filtering is working
   - Check performance monitoring

## Data Privacy

Sentry is configured to filter sensitive data:
- ✅ Authorization tokens removed
- ✅ Passwords removed
- ✅ Cookie headers removed
- ✅ Sensitive query params redacted
- ✅ User PII minimized (only ID and email)

## Ignored Errors

The following errors are ignored to reduce noise:
- Browser extension errors
- Network errors (Failed to fetch)
- Connection errors (ECONNRESET, EPIPE, ETIMEDOUT)

## Sample Rates

- **Production:**
  - Performance: 10% of requests
  - Session Replay: 10% of sessions
  - Error Replay: 100% of error sessions

- **Development:**
  - Performance: 100% of requests
  - Session Replay: 10% of sessions
  - Error Replay: 100% of error sessions
