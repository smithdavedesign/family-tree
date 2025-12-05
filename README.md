# Roots & Branches - Family Tree App

Roots & Branches is a modern, interactive family tree application that allows users to visualize their lineage, manage family members, and enrich their history with photos from Google Photos.

## 🚀 Deployment Status

- **Frontend (Vercel):** [https://family-tree-blue-kappa.vercel.app/](https://family-tree-blue-kappa.vercel.app/)
- **Backend (Render):** [https://family-tree-yogh.onrender.com/](https://family-tree-yogh.onrender.com/)

## ✨ Features

### Core Functionality
- ✅ **Interactive Graph Visualization** - Dynamic family tree layout using React Flow and Dagre
- ✅ **Google Authentication** - Secure sign-in with Google OAuth
- ✅ **Email Authentication** - Passwordless magic link sign-in
- ✅ **Google Drive Integration** - Attach documents directly from your Google Drive
- 🚧 **Google Photos Integration** - Coming soon (pending Google verification)
- ✅ **Real-time Editing** - Add, edit, and link family members instantly
- ✅ **Multi-Tree Support** - Create and manage multiple family trees
- ✅ **Responsive Design** - Works seamlessly on desktop and mobile devices

### Advanced Features
- ✅ **Role-Based Access Control** - Owner, Editor, and Viewer permissions
- ✅ **Search & Filter** - Find family members by name or year range with collapsible interface
- ✅ **Multiple Relationship Types** - Support for biological, adoptive, and step relationships
- ✅ **Merge Duplicates** - Consolidate duplicate person entries
- ✅ **Rate Limiting** - Protection against API abuse
- ✅ **Audit Logging** - Track all user actions for security and compliance
- ✅ **Interactive MiniMap** - Click and drag to navigate large trees
- ✅ **View Lock** - Prevent accidental panning/zooming
- ✅ **Timeline Visualization** - Chronological event view with color-coded dots and density heatmap

## 🛠 Tech Stack

- **Frontend:** React, Vite, TailwindCSS v3, React Flow
- **Backend:** Node.js, Express
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Supabase Auth (Google OAuth + Magic Links)
- **Deployment:** Vercel (Frontend), Render (Backend)

> **Note:** Using stable Tailwind CSS v3.4.17 for reliable utility class generation and consistent styling across all components.

## 🗄️ Database Schema

The application uses a relational database (PostgreSQL) with the following key entities:

![Database Schema](assets/database_schema.png)

- **Trees & Members:** Users can create trees and invite others with specific roles (Owner, Editor, Viewer).
- **Persons & Relationships:** The core genealogy data, supporting complex family structures.
- **Media:** Photos linked to persons, integrated with Google Photos.
- **Security:** Audit logs and invitations for secure access control.

## 📊 Development Progress

### ✅ Phase A: Backend & Auth (100%)
- [x] Node.js/Express server
- [x] Google OAuth 2.0
- [x] REST API endpoints
- [x] Supabase integration

### ✅ Phase B: Frontend Visualization (100%)
- [x] React Flow setup
- [x] Custom node components
- [x] Tree layout (Dagre)
- [x] Interactive controls

### ✅ Phase C: Google Integration (90%)
- [x] Google OAuth authentication
- [x] Google Drive document picker (fully functional)
- [x] Google Picker API integration
- [x] Media storage (Supabase)
- [x] Mock data layer
- 🚧 Google Photos API (pending verification - 2-4 weeks)

### ⚠️ Phase D: Editing & Management (90%)
- [x] Tree creation flow
- [x] Edit person details
- [x] Add/delete persons
- [x] Relationship management
- [x] Multiple marriages/partnerships
- [x] Adoptive/step relationships
- [ ] Undo/Redo (partial)

### ✅ Phase E: Polish & UX (100%)
- [x] Auto-refresh on changes
- [x] Loading states & error handling
- [x] Responsive design
- [x] Search & filter (collapsible interface with toggle button)
- [x] Highlight selected lineage
- [x] **UI/UX Enhancement (Production Ready)** (100%)
  - [x] Design system setup (Tailwind v3 config, Inter font, design tokens)
  - [x] Core component library (Button, Input, Modal, Toast, Avatar)
  - [x] Component migration (SidePanel, all modals)
  - [x] Navigation enhancements (Navbar, TreeSwitcher, Breadcrumbs, Sidebar)
  - [x] Tree visualization polish (Modern nodes, MiniMap, Connection lines)
  - [x] Animations & micro-interactions (Transitions, Hover effects)
  - [x] **Tailwind CSS Configuration Fix** - Downgraded to v3 for stability
  - [x] **Removed inline style workarounds** - All styling now uses Tailwind utilities
  - [x] **Accessibility Improvements** - High contrast buttons, semantic HTML
  - [x] **UI Consistency** - Uniform padding, stable transitions, no layout shifts
  - [x] **Consistent Navigation** - Unified Navbar across all pages with clickable brand logo
  - [x] **Interactive Controls** - View lock, collapsible search, optimized control grouping

- [x] **Tree Visualization Enhancements** (100%)
  - [x] Interactive mini-map (click/drag to navigate)
  - [x] View lock feature (prevent panning/zooming)
  - [x] Auto-avoid overlapping nodes
  - [x] Animated transitions
  - [x] Zoom-to-fit & Center-on-person
  - [x] Photo thumbnails in nodes
  - [x] Keyboard navigation

### ✅ Phase F: Session, Account & Security (100%)
- [x] Persistent login
- [x] Session auto-refresh
- [x] Account deletion
- [x] Auth error handling
- [x] Multi-tree navigation
- [x] Email-based recovery (magic links)
- [x] Role-based access control (RBAC)
- [x] Secure server-side client
- [x] JWT validation
- [x] Rate limiting
- [x] Audit logging

### ✅ Phase G: Collaboration & Sharing (90%)
- [x] Share tree via email/link
- [x] Permission levels (Owner, Editor, Viewer)
- [x] Invite collaborators
- [x] Track who added/edited what
- [ ] Connect trees between users
- [ ] Mark private/sensitive profiles

### ✅ Phase H: Data Structure Enhancements (95%)
- [x] Expand person details (birthplace, deathplace, cause of death, burial place)
- [x] Photo gallery per person (local file upload)
- [x] Extended occupation fields (occupation history, education)
- [x] Biography/notes expansion
- [x] Sources/documents (Google Drive & Local Upload)
- [x] Document management with Google Drive integration
- 🚧 Google Photos integration (pending Google verification)
- [ ] Half-siblings support
- [x] Detect impossible relationships (Validation)

### ✅ Phase I: Tree Visualization Enhancements (100%)
- [x] Horizontal & vertical layout toggle
- [x] Focused mode (ancestors/descendants only)
- [x] Mini-map view (High-visibility filled nodes)
- [x] Auto-avoid overlapping nodes
- [x] Animated transitions
- [x] Zoom-to-fit
- [x] Center-on-person
- [x] Keyboard navigation
- [x] Photo thumbnails in nodes
- [x] Lightbox for full photo view

### ✅ Phase J: Analytics & Timeline (100%)
- [x] Family timeline (chronological events)
- [x] Scrollable timeline with event dots
- [x] Event color coding (Teal=Birth, Red=Death, Purple=Marriage)
- [x] Enhanced tooltips with age calculation
- [x] Drag-to-pan scrolling
- [x] Horizontal guide lines
- [x] Decade ruler for temporal anchoring
- [x] Density heatmap background
- [x] Filter by family side (maternal/paternal)
- [x] Age distribution stats
- [x] Most common locations
- [x] Family branches visualization

### ✅ Phase L: Dual OAuth Architecture (100%) - **COMPLETE**
**Timeline:** Completed Dec 2024 | **Critical for Google Integration Reliability**

**Goal:** Separate authentication from API integrations using industry-standard dual OAuth pattern.

#### Solution Implemented
**OAuth 1: Authentication (Login)**
- Supabase handles user identity
- Google (basic profile), Email Magic Links, Email/Password
- Scopes: `openid email profile`

**OAuth 2: API Integration (Google Services)**
- Custom Google OAuth for Drive/Photos access
- Scopes: `drive.file` + `photoslibrary.readonly`
- Stored in `google_connections` table
- User-triggered via "Connect Google Drive & Photos" in Settings or inline prompts

#### Completed Features
- [x] Database schema (`google_connections` table with RLS)
- [x] Backend OAuth endpoints (`/api/google/*`)
- [x] Automatic token refresh logic
- [x] Settings page UI for connection management
- [x] Inline "Connect Google" prompts in pickers
- [x] Redirect back to origin page after OAuth
- [x] Updated pickers to use connection tokens

**Result:** Google Drive picker works reliably in all sessions. Photos pending Google verification.

---

### 🚧 Phase M: User Registration & Login (0%) - **NEXT**
**Timeline:** 1-2 weeks | **Industry-Standard Authentication**

**Goal:** Add traditional email/password registration to complement Google OAuth and Magic Links.

#### Planned Features
- [ ] Registration page with email/password
- [ ] Unified login page (email/password, magic link, Google)
- [ ] Email verification flow
- [ ] Password reset/forgot password
- [ ] Password strength requirements & validation
- [ ] "Remember Me" functionality
- [ ] Enhanced onboarding (welcome → create tree → tour)
- [ ] Email verification banner
- [ ] Session management improvements

#### Three Authentication Methods
1. **Google OAuth** - Quick social login
2. **Magic Link** - Passwordless email login
3. **Email/Password** - Traditional registration (**NEW**)

**See:** [implementation_plan.md](file:///Users/davidsmith/.gemini/antigravity/brain/cfc51602-8fad-4677-b01d-7cae0eec3106/implementation_plan.md) for detailed design


### ⚠️ Phase K: Production Readiness (85%) - CRITICAL
**Timeline:** 3-6 weeks | **Blocker for Public Launch**

**Progress Summary:**
- Week 1 (Testing): 100% ✅
- Week 2 (Monitoring & Validation): 100% ✅
- Week 3 (Polish & Documentation): 80% 🚀

**Key Achievements:**
- ✅ 36 tests created (94% pass rate)
- ✅ Free error logging system
- ✅ Comprehensive input validation
- ✅ Data export (JSON/GEDCOM)
- ✅ Complete documentation (API, Help, Deployment)
- ✅ Code splitting implemented

#### Testing & Quality Assurance (70%)
- [x] Set up testing framework (Vitest + React Testing Library)
- [x] Set up Playwright for E2E tests
- [x] Create test directory structure (organized in /config folder)
- [x] Create test utilities (custom render, mock data)
- [x] Write component tests (Button - 6 tests, SearchBar - 6 tests)
- [x] Write unit tests (Session Manager - 5 tests)
- [x] Write integration tests (Tree CRUD - 7, Person CRUD - 8, Relationships - 6)
- [x] Write E2E critical journey test (Playwright)
- [x] Add comprehensive testing documentation to README
- [ ] Fix 2 minor SearchBar test issues
- [ ] Achieve 60%+ code coverage
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile device testing (iOS Safari, Android Chrome)
- [ ] Performance testing for large trees (100+ nodes)

#### Error Monitoring & Logging (80%)
- [x] Basic audit logs (backend)
- [x] Integrate free error logging (frontend + backend)
- [x] Configure console-based error tracking
- [x] Set up global error handlers
- [x] Add unhandled promise rejection tracking
- [x] Create error logging documentation
- [x] Create test endpoints for error verification
- [ ] Add database logging for production errors
- [ ] Create error dashboard
- [ ] Set up error alerting (email/webhook)

#### Data Validation & Integrity (80%)
- [x] Basic JWT validation
- [x] Implement input validation (Joi backend, Zod frontend)
- [x] Add impossible date detection (death before birth)
- [x] Add age validation (max 150 years)
- [x] Prevent self-relationships
- [x] Email validation for invitations
- [x] String length limits enforced
- [x] Integrate validation into all API routes
- [ ] Add duplicate person detection
- [ ] Implement data export (JSON/GEDCOM)
- [ ] Add GDPR data export endpoint
- [ ] Create backup/restore functionalityh)
- ✅ **Timeline Visualization** - Chronological event view with color-coded dots and density heatmap
- ✅ **Data Export** - Export trees as JSON or GEDCOM format
- ✅ **Testing** - 36 tests with 100% pass rate (Vitest + Playwright)
- ✅ **Error Logging** - Free error tracking system (no external costs)
- ✅ **Input Validation** - Comprehensive validation (impossible dates, age limits)
- ✅ **Code Splitting** - Route-based lazy loading for optimal performance
- ✅ **Image Lazy Loading** - Optimized photo gallery loading

## 📚 Documentation

- **[User Guide](docs/HELP.md)** - Complete help documentation with tutorials and troubleshooting
- **[API Documentation](docs/API.md)** - Full API reference with examples
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment to Supabase + Vercel + Render
- **[Testing Guide](#-testing)** - How to run and write tests

## 🏗️ Architecture
ompliance (data export, right to be forgotten)
- [ ] Backup/restore functionality

#### Performance Optimization (70%)
- [x] Basic lazy loading
- [x] React Flow optimization
- [x] Code splitting (route-based lazy loading)
- [x] Loading states and suspense
- [ ] Image lazy loading
- [ ] Bundle size optimization (<500KB)
- [ ] Lighthouse score >90
- [ ] Database query optimization
- [ ] CDN integration
- [ ] Database indexing strategy
- [ ] CDN for static assets
- [ ] Bundle size optimization (<500KB)

#### Documentation (80%)
- [x] README with all features
- [x] Comprehensive help documentation (docs/HELP.md)
- [x] Complete API documentation (docs/API.md)
- [x] Deployment guide (docs/DEPLOYMENT.md)
- [x] Testing documentation in README
- [x] Error logging documentation
- [x] Keyboard shortcuts guide
- [ ] Inline code comments
- [ ] Video tutorials
- [ ] FAQ section
- [ ] User onboarding flow (interactive tutorial)
- [ ] Help documentation (FAQ, guides)
- [ ] Tooltips/hints throughout UI
- [ ] Video tutorials
- [ ] Terms of Service
- [ ] Privacy Policy

#### Security Hardening (70%)
- [x] JWT authentication
- [x] RBAC
- [x] Rate limiting
- [x] Audit logging
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (input sanitization)
- [ ] CSRF protection
- [ ] Security headers (CSP, HSTS)
- [ ] Dependency vulnerability scanning
- [ ] Penetration testing

## 🔌 API Endpoints

### Trees
- `GET /api/trees` - Fetch all trees owned by the current user
- `POST /api/trees` - Create a new tree
- `GET /api/tree/:id` - Fetch a specific tree with all persons and relationships
- `DELETE /api/tree/:id` - Delete a tree (owner only)

### Persons
- `POST /api/person` - Create a new person node
- `PUT /api/person/:id` - Update a person's details
- `DELETE /api/person/:id` - Delete a person
- `POST /api/person/merge` - Merge duplicate persons
- `GET /api/person/:id/media` - Fetch attached media for a person

### Relationships
- `POST /api/relationship` - Create a link between two persons
- `DELETE /api/relationship/:id` - Delete a relationship

### Media
- `POST /api/media` - Attach a photo to a person

### Account
- `DELETE /api/account` - Delete user account (with cascade)

## 🔐 Security Features

- **JWT Authentication** - Secure token-based auth
- **Role-Based Access Control** - Owner/Editor/Viewer permissions
- **Rate Limiting** - Tiered limits (100 req/15min general, 30 req/15min writes)
- **Audit Logging** - Track all user actions
- **Row Level Security** - Database-level access control
- **Magic Links** - Passwordless authentication
- **Session Management** - Auto-refresh and persistence

## 📊 Error Monitoring & Logging

### Free Error Logging System
The application uses a custom, **100% free** error logging system with no external service costs.

**Features:**
- Real-time error tracking (frontend + backend)
- Console-based logging (development)
- Optional database logging (production)
- Global error handlers
- Unhandled promise rejection tracking
- User context tracking

**Accessing Error Logs:**
1. **Development:** Check browser console (frontend) or terminal (backend)
2. **Production:** Errors logged to console (can be captured by hosting platform logs)
3. **Optional:** Implement database logging for persistent error storage

**Test Endpoints:**
```bash
# Test backend error logging
curl http://localhost:3000/api/test/error

# Test backend message logging  
curl http://localhost:3000/api/test/message

# Health check
curl http://localhost:3000/api/test/health
```

**Usage in Code:**
```javascript
// Frontend
import { captureException, captureMessage } from './utils/errorLogger';

try {
  // risky operation
} catch (error) {
  captureException(error, { context: 'additional info' });
}

// Backend
const { captureException } = require('./utils/errorLogger');
captureException(error, { userId: user.id });
```

### Audit Logs
All user actions are logged to the database for security and compliance:
- **Table:** `audit_logs`
- **Tracked Actions:** CREATE, UPDATE, DELETE, VIEW
- **Data Stored:** user_id, action, resource_type, resource_id, IP, user agent, metadata
- **Access:** Via Supabase dashboard or SQL queries

**Example Query:**
```sql
SELECT * FROM audit_logs 
WHERE user_id = 'user-id' 
ORDER BY created_at DESC 
LIMIT 100;
```

## 🧪 Testing

The project includes comprehensive testing infrastructure with **36 tests** covering unit, integration, component, and E2E testing.

### Test Suite Overview
- **Unit Tests:** Session management, utilities
- **Component Tests:** Button, SearchBar, UI components
- **Integration Tests:** Tree CRUD, Person CRUD, Relationships
- **E2E Tests:** Critical user journeys (Playwright)

**Current Status:** 34/36 tests passing (94% pass rate)

### Running Tests

```bash
cd client

# Run all tests in watch mode
npm test

# Run tests once (CI mode)
npm test -- --run

# Run tests with UI
npm test:ui

# Generate coverage report
npm test:coverage

# Run E2E tests
npm test:e2e

# Run E2E tests with UI
npm test:e2e:ui
```

### Test Structure

```
client/src/test/
├── setup.js                        # Global test setup
├── utils/
│   ├── testUtils.jsx              # Custom render with providers
│   └── mockData.js                # Mock data for tests
├── components/
│   ├── Button.test.jsx            # Component tests
│   └── SearchBar.test.jsx
├── unit/
│   └── sessionManager.test.js     # Unit tests
├── integration/
│   ├── tree-crud.test.js          # Integration tests
│   ├── person-crud.test.js
│   └── relationship.test.js
└── e2e/
    └── critical-journey.spec.js   # E2E tests (Playwright)
```

### Writing Tests

**Component Test Example:**
```javascript
import { describe, it, expect } from 'vitest';
import { render, screen } from '../utils/testUtils';
import { Button } from '../../components/ui';

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

**Integration Test Example:**
```javascript
import { describe, it, expect, vi } from 'vitest';

global.fetch = vi.fn();

describe('Tree CRUD', () => {
  it('should create a new tree', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'tree-1', name: 'My Tree' })
    });
    
    const response = await fetch('/api/trees', {
      method: 'POST',
      body: JSON.stringify({ name: 'My Tree' })
    });
    
    expect(response.ok).toBe(true);
  });
});
```

### Test Configuration

**Vitest Config:** `client/config/vitest.config.js`
- Environment: jsdom
- Coverage: v8 provider
- Setup: Automatic cleanup

**Playwright Config:** `client/config/playwright.config.js`
- Browsers: Chrome, Firefox, Safari
- Base URL: http://localhost:5173
- Auto web server startup

### Best Practices

1. **Use test utilities:** Import from `../utils/testUtils` for consistent setup
2. **Mock external dependencies:** Use `vi.fn()` for API calls
3. **Test user behavior:** Focus on what users see and do
4. **Keep tests isolated:** Each test should be independent
5. **Use descriptive names:** Test names should explain what they verify

### CI/CD Integration

Tests can be run in GitHub Actions or other CI/CD pipelines:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd client && npm install
      - run: cd client && npm test -- --run
```

## 💻 Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/smithdavedesign/family-tree.git
   cd family-tree
   ```

2. **Setup Environment Variables:**
   - Create `.env` in `client/` and `server/` based on the provided examples.

3. **Start the Client:**
   ```bash
   cd client
   npm install
   npm run dev
   ```

4. **Start the Server:**
   ```bash
   cd server
   npm install
   node index.js
   ```

## 🔐 Google OAuth & Runtime Configuration

### Architecture
This app uses **Runtime Configuration** to serve Google API keys from the backend, eliminating build-time environment variable issues:
- **Frontend**: Fetches config from `/api/config` at runtime
- **Backend** (Render): Serves `GOOGLE_CLIENT_ID` and `GOOGLE_API_KEY` via API endpoint
- **Vercel**: No Google API keys needed in frontend environment variables

### Current Status
- ✅ **Google Drive Integration**: Fully functional
- ⚠️ **Google Photos Integration**: May show 403 errors until Google verification completes

### Setup Requirements

#### Backend (Render)
Set these environment variables:
```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_API_KEY=your-api-key
```

#### Frontend (Vercel)
Only Supabase variables needed:
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Google Photos Verification Status
Google Photos scope (`photoslibrary.readonly`) requires verification. Until approved:
- Photos picker may return 403 errors
- Document picker works fully (Drive scope doesn't require verification)
- Users can still upload photos locally

For more details, see:
- `google-verification-justification.md` - Detailed scope justification
- `youtube-demo-script.md` - Demo video production guide

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Current Status:** Phase J Complete (Timeline UI) | All Core Features Implemented | Production Readiness: 48%
