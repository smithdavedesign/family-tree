# Roots & Branches - Family Tree App

Roots & Branches is a modern, interactive family tree application that allows users to visualize their lineage, manage family members, and enrich their history with photos from Google Photos.

## 🚀 Deployment Status

- **Frontend (Vercel):** [https://family-tree-blue-kappa.vercel.app/](https://family-tree-blue-kappa.vercel.app/)
- **Backend (Render):** [https://family-tree-yogh.onrender.com/](https://family-tree-yogh.onrender.com/)

## ✨ Features

### Core Functionality
- ✅ **Interactive Graph Visualization** - Dynamic family tree layout using React Flow and Dagre
- ✅ **Google Authentication** - Secure sign-in with Google OAuth
- ✅ **Email/Password Authentication** - Traditional registration and login with password validation
- ✅ **Email Authentication** - Passwordless magic link sign-in
- ✅ **Google Drive Integration** - Attach documents directly from your Google Drive
- 🚧 **Google Photos Integration** - Coming soon (pending Google verification)
- ✅ **Real-time Editing** - Add, edit, and link family members instantly
- ✅ **Multi-Tree Support** - Create and manage multiple family trees
- ✅ **Responsive Design** - Mobile-first refinements with consolidated menus and FABs

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

### 💰 Payments & Subscription
- ✅ **Free Tier** - Basic access with 50 AI tokens/month
- ✅ **Pro Subscription** - $4.99/mo or $49.99/yr via Stripe
- ✅ **Token System** - Usage-based consumption for premium AI features
- ✅ **Family Coupon** - Secret code redemption for family members
- ✅ **Billing Portal** - Self-serve subscription management (Stripe Customer Portal)

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
- [x] **Mobile Optimization** (100%)
  - [x] Consolidated navigation (bottom sheet menu)
  - [x] Mobile FAB for tree editing
  - [x] Interaction-aware Zen Mode (auto-fading UI)
  - [x] Responsive view mode selector
  - [x] Strategic tool grouping (Tools menu)

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

### ✅ Phase H: Data Structure Enhancements (100%)
- [x] Expand person details (birthplace, deathplace, cause of death, burial place)
- [x] Photo gallery per person (local file upload)
- [x] Extended occupation fields (occupation history, education)
- [x] Biography/notes expansion
- [x] Sources/documents (Google Drive & Local Upload)
- [x] Document management with Google Drive integration
- [x] High-fidelity display of array-like fields (Work History, Education)
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

### ✅ Phase N: Person Profile Page (100%) - **COMPLETE**
**Timeline:** Completed Dec 2024 | **Rich Biographical Experience**

**Goal:** Create detailed person profile pages accessible from tree, gallery, and stories views.

#### Completed Features
- [x] PersonPage route (`/tree/:treeId/person/:personId`)
- [x] Hero section with profile photo, name, lifespan, and vital stats
- [x] Life Timeline with events, photos, and age calculation
- [x] Person-specific Photo Gallery with year grouping
- [x] Stories section with TipTap content preview
- [x] Documents section with file type icons
- [x] Relationship Map showing family connections
- [x] Navigation integration (tree → person, lightbox → person)
- [x] SidePanel integration for editing
- [x] Breadcrumbs with dynamic navigation
- [x] Default to standard tree view

#### Components Created
- `PersonPage.jsx` - Main page container
- `PersonHero.jsx` - Profile header with stats
- `PersonTimeline.jsx` - Life events timeline
- `PersonPhotoGallery.jsx` - Photo collection
- `PersonStories.jsx` - Story previews
- `PersonDocuments.jsx` - Document library
- `RelationshipMap.jsx` - Family connections

**Design:** Modern, emotional storytelling approach with clean UI, gradients, and smooth animations inspired by Apple Contacts.

---

### ✅ Phase O: Albums & Collections (100%) - **COMPLETE**
**Timeline:** Completed Dec 2024 | **Photo Organization System**

**Goal:** Create a comprehensive album system to organize photos into themed collections with full CRUD operations.

#### Completed Features
- [x] Database tables (`albums`, `album_photos`) with RLS policies
- [x] 9 API endpoints for album management and photo assignment
- [x] AlbumManager component (grid view, search, create)
- [x] AlbumView component (photo grid, edit/delete, lightbox)
- [x] AlbumSelector component (multi-select, bulk operations)
- [x] AlbumBadge component (small indicators)
- [x] Route: `/tree/:treeId/albums`
- [x] Navigation integration (TreePage → Albums link)
- [x] Permission system (viewer/editor/owner)
- [x] Private albums (owner-only visibility)
- [x] Cover photo support (default + manual selection)
- [x] Photo count tracking
- [x] Sort order management
- [x] Breadcrumb navigation with deep linking

#### Components Created
- `AlbumManager.jsx` - Album grid with search/create
- `AlbumView.jsx` - Album details with photo management
- `AlbumSelector.jsx` - Multi-select photo assignment
- `AlbumBadge.jsx` - Compact album indicator
- `AlbumPage.jsx` - Main album route

**API:** 9 endpoints covering album CRUD, photo management, bulk operations, and person album lookups.

---

### ✅ Phase P: Map & Geo-Intelligence (100%) - **COMPLETE**
**Timeline:** Completed Dec 2024 | **Location-Based Photo Discovery**

**Goal:** Transform the photo gallery into an interactive map experience with clustering, person attribution, and global travel insights.

#### Completed Features
- [x] Interactive map gallery with marker clustering (Badge Numbers)
- [x] Layer controls (Street, Satellite, Topographic)
- [x] Advanced Visualization Layer: High-Contrast Heatmap
- [x] Rich map popups with person attribution, photos, and story links
- [x] Unified Data Aggregation: (Photos + Stories + Events + Vitals)
- [x] Performance: Chunked loading for clustering large datasets
- [x] "Nearby Photos" discovery (20km radius)
- [x] Global Travel Dashboard widget
- [x] Consistent teal color scheme for markers and clusters

#### Components Created
- `MapGallery.jsx` - Interactive map with clustering and layers
- `MapPopup.jsx` - Rich popup with person details and actions
- `PersonHeatmap.jsx` - Individual location history visualization
- `GlobalTravelDashboard.jsx` - Dashboard widget for travel stats

#### API Endpoints
- `GET /api/map/nearby` - Find photos within radius
- `GET /api/person/:id/map-stats` - Person location statistics
- `GET /api/map/global-stats` - Global travel analytics

**UX Enhancement:** Clicking map markers shows info card first, with explicit "View Full Image" button for lightbox.

---

<<<<<<< HEAD
### ✅ Phase Q: Location-Story Enhancements (100%) - **COMPLETE**
**Timeline:** Completed Dec 2024 | **Normalized Location System**

**Goal:** Expand location system beyond photos to include stories and people, with manual location creation and comprehensive linking.

#### Completed Features
- [x] Normalized `locations` table (name, address, coordinates, date range, notes)
- [x] `story_locations` join table for story-location links
- [x] `person_locations` join table for person migration/travel history
- [x] `life_event_locations` join table for linking multiple locations to life events
- [x] 16 Location API endpoints (CRUD + linking)
- [x] LocationModal with full validation and toast notifications
- [x] LocationSelector component (search, create, chips)
- [x] Hybrid geocoding (Dev: Nominatim Docker, Prod: Google Maps API)
- [x] PersonLocations widget ("Places Lived/Visited")
- [x] Story Editor integration (attach locations)
- [x] PhotoLightbox displays locations for events & stories
- [x] Story locations integrated into Map Stats & Heatmap
- [x] Life Event multi-location support in LifeEventForm & PersonTimeline
- [x] RLS policies for secure location access

#### API Endpoints (16)
- Location CRUD: Create, Read, Update, Delete, List, Details
- Story linking: Add, Remove, Get story locations
- Person linking: Add, Remove, Get person locations
- Life Event linking: Add, Remove, Get event locations
- Full location aggregation for map statistics (Photos + Stories + Events + Places Lived)

---

### ✅ Phase R: Onboarding & Comments (100%) - **COMPLETE**
**Timeline:** Completed Dec 2024 | **User Engagement & Interaction**

**Goal:** Enhance user onboarding experience and add commenting system for collaborative storytelling.

#### Completed Features
- [x] Welcome Wizard for new users
- [x] Comments system for photos, stories, and people
- [x] Database table (`comments`) with RLS policies
- [x] CommentSection component with real-time updates
- [x] Comment CRUD operations (create, read, delete)
- [x] User attribution with avatars and timestamps
- [x] Comments integrated into PhotoLightbox, StoryPage, and PersonPage
- [x] MessageCircle icon for consistent UI
- [x] Proper section ordering (Stories → Events → Albums → Comments)
- [x] Permission system (authors and tree owners can delete)

#### Components Created
- `CommentSection.jsx` - Reusable comment interface
- `WelcomeWizard.jsx` - Onboarding flow

#### API Endpoints (3)
- `GET /api/comments/:resourceType/:resourceId` - Fetch comments
- `POST /api/comments` - Add comment
- `DELETE /api/comments/:commentId` - Delete comment

**UX Enhancement:** Comments encourage family collaboration and storytelling around photos and memories.

---

### ✅ Phase T: UX Polish & Performance (100%) - **COMPLETE**
**Timeline:** Completed Dec 2024 | **UI Refinements & Optimization**

**Goal:** Polish user interfaces, fix inconsistencies, and optimize performance for better user experience.

#### Completed Features
- [x] Album editing UX improvements
  - Edit form now pre-fills with current title and description
  - Fixed private album checkbox styling (proper sizing and alignment)
  - Consistent UI between create and edit modals
- [x] Settings navigation reorganization
  - Simplified navbar dropdown to single "Settings" option
  - Removed delete account from Quick Settings modal (safety improvement)
  - Added "Open Full Account Settings" button in Quick Settings
  - Improved modal sizing (`lg` instead of invalid `2xl`)
- [x] Button consistency in Account Settings page
  - All buttons now use design system's `fullWidth` prop
  - Removed raw Tailwind className overrides
- [x] Photos table database migration
  - Created `012_photos_table.sql` migration
  - Added missing columns: `tree_id`, `google_media_id`, `thumbnail_url`, `updated_at`
  - Supports both local and Google Photos uploads
- [x] Photo upload performance optimization
  - Implemented React Query targeted cache invalidation
  - Removed expensive full tree refreshes after uploads
  - Optimistic cache updates for instant UI feedback
  - Only invalidates `['photos', personId]` and `['person', personId]` queries

**Performance Impact:** Photo uploads no longer trigger expensive tree re-renders, making the app much more responsive with large trees.

---

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

### ✅ Phase M: User Registration & Authentication (100%) - **COMPLETE**
**Timeline:** Completed Dec 2024 | **Industry-Standard Authentication**

**Goal:** Traditional email/password registration to complement Google OAuth and Magic Links.

#### Completed Features
- [x] Registration page with email/password and validation
- [x] Unified login page (email/password, magic link, Google tabs)
- [x] Email verification flow with resend option
- [x] Password reset/forgot password
- [x] Password strength meter and requirements validation
- [x] "Remember Me" functionality (30 days)
- [x] Secure password hashing via Supabase
- [x] Root route updated to new login page
- [x] All auth redirects to /trees dashboard

#### Three Authentication Methods
1. **Google OAuth** - Quick social login ✅
2. **Magic Link** - Passwordless email login (Existing users only) ✅
3. **Email/Password** - Traditional registration with validation ✅

**Security:** Password requirements (8+ chars, mixed case, numbers, special), email verification required, bcrypt hashing, rate limiting.
**Strict Mode:** Magic Links are restricted to existing accounts to prevent accidental signups. New users must register first.

**Routes:** `/register`, `/login`, `/forgot-password`, `/reset-password`, `/auth/confirm`

--- ✅

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

#### Performance Optimization (90%)
- [x] Basic lazy loading
- [x] React Flow optimization
- [x] Code splitting (route-based lazy loading)
- [x] Loading states and suspense
- [x] Image lazy loading (Intersection Observer)
- [x] Virtualized Gallery Rendering (@tanstack/react-virtual)
- [ ] Bundle size optimization (<500KB)
- [ ] Lighthouse score >90
- [ ] Database query optimization
- [ ] CDN integration
- [ ] Database indexing strategy
- [ ] CDN for static assets

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

### 🔮 Future Roadmap (Planned)
- [x] **F.13 Life Events Model**: Rich timeline events (birth, death, work, education) with date ranges and locations.
- [x] **H.15 Events & Reminders**: Dashboard widget for upcoming birthdays, anniversaries, and life events.
- [x] **F.14 Photo Map View**: Interactive map showing photos clustered by location.
- [x] **F.11 Storytelling / Blog**: "Stories" feature to write rich text articles about ancestors.
- [x] **F.12 Visualization Enhancements**: Fan charts, descendant charts, and timeline views.
- [x] **F.15 Photo Organization**: Albums, tagging, and smart categorization.
- [ ] **F.16 Family Tree Experience**: "Onboarding" wizard and "Invite" flow improvements.
- [ ] **G.17 Collaboration**: Activity feed, comments, and granular permissions.
- [ ] **F.18 Sensitive Data**: Privacy controls for living people and sensitive facts.
- [ ] **F.19 Family Utility**: Recipe book, family calendar, and address book.etween Genetic, Emotional, and Location-based trees.

### C. Photo Organization Enhancements
- **Auto-Create Albums**: AI detection for vacations, holidays, and events.
- **Memory Collections**: Suggested albums attached to persons or branches.

### D. Family Tree Experience
- **Family Tree Animation**: Documentary-style "Roots → Leaves" growth animation.
- **Change Node Design**: Customizable leaf-node variants and styles.

### E. Collaboration & Social Features
- **Tree Collaboration Tools**: Invite relatives, comments, version history.
- **Ask Family a Question**: Broadcast questions to contributors.

### F. Life Events & Personal History
- **Life Events Model**: Structured timeline data (Graduation, Military Service, etc.).

### G. Sensitive Data & Personal Archives
- **Memory Vault**: Encrypted storage for sensitive documents (birth certificates, etc.).

### H. Family Utility Features
- **Events & Reminders**: Birthday/Anniversary tracker.
- **Audio Memories**: Voice recordings attachable to persons.

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

### Backend Structured Logging

The backend utilizes a custom `Logger` class for consistent, color-coded console output in development and JSON in production.

**Features:**
- **Color Coding:** 
  - Methods: GET (Blue), POST (Green), PUT (Yellow), DELETE (Red)
  - Status: 2xx (Green), 3xx (Cyan), 4xx (Yellow), 5xx (Red)
- **Inline Details:** HTTP method, URL, status code, and duration are printed inline for readability.
- **Context:** Enriched with `userId`, `requestId` for tracing.

```javascript
/* Usage */
const logger = require('../utils/logger');
logger.info('Action performed', { userId: '123' });
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
│   ├── TreeDashboard.test.jsx     # Dashboard & Filtering tests
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

### Running Tests

```bash
cd client

# Run all tests in watch mode
npm test

# Run tests once (CI mode)
npm test -- --run

# Run specific test file (e.g., TreeDashboard)
npm test -- src/test/components/TreeDashboard.test.jsx

# Run tests with UI
npm test:ui

# Generate coverage report
npm test:coverage
```

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
6. **ESM Compatibility:** Use `vi.hoisted()` for top-level mocks and ensure all local imports have `.js` extensions. Use dynamic `await import()` for modules that need to be mocked to avoid ESM hoisting issues.

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

### Google Photos Verification Status
Google Photos scope (`photoslibrary.readonly`) requires verification. Until approved:
- Photos picker may return 403 errors
- Document picker works fully (Drive scope doesn't require verification)
- Users can still upload photos locally

For more details, see:
- `google-verification-justification.md` - Detailed scope justification
- `youtube-demo-script.md` - Demo video production guide

### Environment Variables (Production)
**Frontend** (Vercel/Build):
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

**Backend** (Render):
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `GOOGLE_CLIENT_ID` - OAuth 2.0 client ID
- `GOOGLE_CLIENT_SECRET` - OAuth 2.0 client secret
- `GOOGLE_API_KEY` - Google Maps/Places API key (served to frontend via `/api/config`)

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Current Status:** Phase S Complete (Hybrid Geocoding) | Dual OAuth + Self-Hosted Dev Geocoding | Production Readiness: 92%
