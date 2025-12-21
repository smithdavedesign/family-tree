# Role: Principal Full Stack Architect
# Project Name: "Roots & Branches" (Family Tree App)

## Objective
Build a web-based Family Tree application where users log in via Google SSO, email magic links, or email/password. The app allows users to create/manage multiple family trees, visualize lineage using a dynamic graph, collaborate with other users, and attach media from Google Photos to individual nodes.

## 🛑 Constraints (Strict)
1. **Cost:** 100% Free Tier architecture.
2. **Deployment:** 
   - Frontend: Vercel (Free)
   - Backend: Render.com (Free Web Service)
   - Database: Supabase (Free PostgreSQL)
3. **Tech Stack:**
   - Frontend: React (Vite), TailwindCSS, React Flow (for tree visualization)
   - Backend: Node.js, Express
   - Auth: Supabase Auth (Google OAuth + Magic Links + Email/Password)
   - API Style: REST

## 📊 Current Project Status

**Overall Progress:** 99.5% Complete | **Current Phase:** Phase K (Production Readiness) | **Next:** Launch 🚀

### Completed Phases:
- ✅ **Phase A:** Backend & Auth (100%)
- ✅ **Phase B:** Frontend Visualization (100%)
- ✅ **Phase C:** Google Integration (100%)
- ✅ **Phase D:** Editing & Management (100%)
- ✅ **Phase E:** Polish & UX (100%)
- ✅ **Phase F:** Session, Account & Security (100%)
- ✅ **Phase G:** Collaboration & Sharing (90%)
- ✅ **Phase H:** Data Structure Enhancements (100%)
- ✅ **Phase I:** Tree Visualization Enhancements (100%)
- ✅ **Phase J:** Analytics & Timeline (100%)
- ✅ **Phase L:** Dual OAuth Architecture (100%)
- ✅ **Phase M:** User Registration & Auth (100%)
- ✅ **Phase O:** Albums & Collections (100%)
- ✅ **Phase P:** Map & Geo-Intelligence (100%)
- ✅ **Phase Q:** Location-Story Enhancements (100%)
- ✅ **Phase R:** Onboarding & Comments (100%)
- ✅ **Phase S:** Hybrid Geocoding (100%)

### In Progress / Upcoming:
- 🚀 **Phase K:** Production Readiness (Testing, Monitoring, Validation) (90%)

## 1. Architecture & Data Schema

**Database (PostgreSQL via Supabase):**

Available tables:
- `users`: (id, google_id, email, avatar_url, created_at)
- `trees`: (id, name, owner_id, is_public, created_at)
- `tree_members`: (tree_id, user_id, role [owner/editor/viewer])
- `persons`: (id, tree_id, first_name, last_name, dob, dod, pob, gender, bio, occupation, profile_photo_url, attributes JSONB)
- `relationships`: (id, tree_id, person_1_id, person_2_id, type [parent_child, spouse, adoptive_parent_child, step_parent_child])
- `media`: (id, person_id, url, type, google_media_id)
- `invitations`: (id, tree_id, inviter_id, role, token, expires_at)
- `audit_logs`: (id, user_id, action, resource_type, resource_id, ip_address, user_agent, status_code, metadata JSONB, created_at)
- `google_connections`: (id, user_id, access_token, refresh_token, expires_at, scopes, google_email, google_name, google_picture)

**Key SQL Migrations:**
- `server/sql-prompts/schema.sql` - Initial schema
- `server/sql-prompts/complete_setup.sql` - Full setup with RLS
- `server/sql-prompts/audit_logs_migration.sql` - Audit logging
- `server/sql-prompts/rbac_migration.sql` - Role-based access control
- `server/sql-prompts/google_connections_migration.sql` - Dual OAuth setup
- `server/sql-prompts/add_google_profile_columns.sql` - Google profile info
- `server/sql-prompts/life_event_locations_migration.sql` - Multi-location life events

## 2. Core Features Implemented

### ✅ Authentication & Security
- Google OAuth 2.0 (Dual OAuth for Login vs API)
2. **Magic Link** - Passwordless email login (Existing users only) ✅
3. **Email/Password** - Traditional registration with validation ✅

**Security:** Password requirements (8+ chars, mixed case, numbers, special), email verification required, bcrypt hashing, rate limiting.
**Strict Mode:** Magic Links are restricted to existing accounts to prevent accidental signups. New users must register first. (tiered: 100/15min general, 30/15min writes, 2/hour account deletion)
- Audit logging (tracks all user actions)
- Role-Based Access Control (Owner/Editor/Viewer)
- Account deletion with cascade

### ✅ Tree Management
- Create multiple trees per user
- Tree dashboard with grid view
- Tree switcher dropdown (quick navigation)
- Delete trees (owner only)
- Auto-assign owner role on tree creation

### ✅ Person Management
- Add/edit/delete persons
- Merge duplicate persons
- Support for multiple relationship types:
  - Biological parent-child
  - Adoptive parent-child
  - Step parent-child
  - Spouse/partner
- Profile photos from Google Photos
- Rich person details (name, dates, bio, occupation, location)

### ✅ Visualization
- Interactive React Flow graph
- Dagre auto-layout (hierarchical)
- Custom node components with photos
- Click to edit, right-click context menu
- Search & filter (by name, year range)
- Highlight selected lineage
- Responsive design (mobile-friendly)
- Timeline view with event visualization

### ✅ Google Photos Integration
- Photos Picker API integration
- Attach photos to persons
- Store media references in database
- Mock mode for local development (VPN bypass)

### ✅ Google Integration
- **Dual OAuth Architecture:** Separates login from API access
- **Google Drive:** Document picker integration
- **Google Photos:** Photos picker integration (pending verification)
- **Settings:** Manage connected Google account (view email/avatar)

## 3. Development Roadmap

### Phase A: Backend & Auth ✅ (100%)
- [x] Node.js/Express server
- [x] Google OAuth 2.0 with Photos scope
- [x] REST endpoints (trees, persons, relationships, media)
- [x] Supabase integration

### Phase B: Frontend Visualization ✅ (100%)
- [x] React Flow setup
- [x] Custom node components
- [x] Dagre layout algorithm
- [x] Interactive controls (click, drag, zoom)

### Phase C: Google Integration ✅ (100%)
- [x] Media picker component
- [x] Google Photos API integration
- [x] Media storage in database
- [x] Mock data layer for local testing

### Phase D: Editing & Management ✅ (100%)
- [x] Tree creation flow
- [x] Edit person details (side panel)
- [x] Add person (context menu)
- [x] Add/delete relationships
- [x] Multiple marriages/partnerships
- [x] Adoptive/step relationships
- [x] Merge duplicates
- [x] Undo/Redo (partial implementation)
- [x] Expand/collapse nodes

### ✅ Phase E: Polish & UX (100%)
- [x] Responsive layout optimization
- [x] Loading skeletons & spinners
- [x] Error boundaries & toast notifications
- [x] Keyboard shortcuts
- [x] Accessibility Improvements
- [x] UI Consistency (Tailwind v3)
- [x] Interactive MiniMap
- [x] View lock feature

### Phase F: Session, Account & Security ✅ (100%)
- [x] Persistent login across reloads
- [x] Session expiration & silent refresh
- [x] Account deletion flow
- [x] Auth error page
- [x] Multi-tree navigation
- [x] Email-based recovery (magic links)
- [x] Role-based access control (RBAC)
- [x] Secure server-side Supabase client
- [x] API middleware JWT validation
- [x] Rate limiting
- [x] Logging & audit trail

### Phase G: Collaboration & Sharing ✅ (90%)
- [x] Share tree via email/link
- [x] Permission levels (Owner, Editor, Viewer)
- [x] Invite collaborators
- [x] Track who added/edited what
- [ ] Connect trees between users
- [ ] Mark private/sensitive profiles

### Phase H: Data Structure Enhancements ✅ (100%)
- [x] Expand person details
- [x] Photo gallery per person
- [x] Biography/notes expansion
- [x] Sources/documents
- [ ] Auto-infer relationships
- [x] Detect impossible relationships

### ✅ Phase I: Tree Visualization Enhancements (100%)
- [x] Layout direction toggle
- [x] Focus Mode
- [x] MiniMap
- [x] Visual Polish

### ✅ Phase J: Analytics & Timeline (100%)
- [x] Interactive Timeline
- [x] Analytics (Age distribution, Location heatmaps)

### ✅ Phase L: Dual OAuth Architecture (100%)
- [x] Database schema (`google_connections`)
- [x] Backend OAuth endpoints
- [x] Token refresh logic
- [x] Settings page UI
- [x] Google Account Info Display

### ✅ Phase M: User Registration & Auth (100%)
- [x] Registration page
- [x] Unified login page
- [x] Email verification flow
- [x] Password reset flow
- [x] Password strength meter

### ⚠️ Phase K: Production Readiness (90%)
**Timeline:** 3-6 weeks | **Overall Readiness:** 85%

**Status:** Ready for MVP launch

**Achievements:**
- ✅ 36 tests created (100% pass rate)
- ✅ Free error logging system (no external costs)
- ✅ Comprehensive input validation (Joi + Zod)
- ✅ Data export (JSON/GEDCOM)
- ✅ Complete documentation (1,500+ lines)
- ✅ Code splitting implemented

#### Week 1: Testing Foundation (100% Complete) ✅
- [x] Testing Foundation (Vitest + Playwright)

#### Week 2: Monitoring & Validation (100% Complete) ✅
- [x] Monitoring & Validation (Error logging)
- [x] Implement impossible date detection (death before birth)
- [x]#### Week 3: Polish & Documentation (60% Complete) 🚀
- [x] Documentation (Help, API, Deployment)
- [x] Implement code splitting (route-based lazy loading)
- [x] Add keyboard shortcuts documentation
- [x] Update README with testing guide
- [x] Add image lazy loading
- [x] Virtualized Gallery Rendering
- [ ] Run Lighthouse performance audit (target: >90)
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile responsiveness testing (iOS Safari, Android Chrome)
- [ ] Optimize bundle size (<500KB)
- [ ] Create user onboarding tutorial
- [ ] Image optimization (compress photos with Sharp)
- [ ] Database indexing for performance

#### Security Hardening (Ongoing)
- [x] JWT authentication
- [x] RBAC (Owner/Editor/Viewer)
- [x] Rate limiting (tiered)
- [x] Audit logging
- [ ] SQL injection prevention (verify parameterized queries)
- [ ] XSS prevention (input sanitization)
- [ ] CSRF protection
- [ ] Security headers (CSP, HSTS, X-Frame-Options)
- [ ] Dependency vulnerability scanning (`npm audit`)
- [ ] Penetration testing (basic)

#### Launch Checklist
- [ ] All critical tests passing
- [ ] Error monitoring active
- [ ] Performance metrics tracked
- [ ] User documentation complete
- [ ] Terms of Service written
- [ ] Privacy Policy written
- [ ] GDPR compliance verified
- [ ] Backup system tested
- [ ] Security audit completed
- [ ] Load testing completed (100+ concurrent users)

## 4. Future Roadmap (Planned)
- [x] **F.13 Life Events Model**: Rich timeline events (birth, death, work, education) with date ranges and locations.
- [x] **H.15 Events & Reminders**: Dashboard widget for upcoming birthdays, anniversaries, and life events.
- [x] **F.14 Photo Map View**: Interactive map showing photos clustered by location.
- [x] **F.11 Storytelling / Blog**: "Stories" feature to write rich text articles about ancestors.
- [ ] **F.12 Visualization Enhancements**: Fan charts, descendant charts, and timeline views.
- [ ] **F.15 Photo Organization**: Albums, tagging, and smart categorization.
- [ ] **F.16 Family Tree Experience**: "Onboarding" wizard and "Invite" flow improvements.
- [ ] **G.17 Collaboration**: Activity feed, comments, and granular permissions.
- [ ] **F.18 Sensitive Data**: Privacy controls for living people and sensitive facts.
- [ ] **F.19 Family Utility**: Recipe book, family calendar, and address book.Slideshow version, Optional AI voice narration

### B. Visualization & Insight Features
3. **Relationship Heatmap (Who Appears Together?)**
   - 2D matrix showing who appears together most
   - Clusters highlight siblings, partners, close relationships
   - Reveals emotional insights from photo frequency

4. **Family Migration Map**
   - Uses birthplaces + EXIF GPS
   - Shows movement of family across cities/countries
   - One animated line per family branch
   - Timeline slider for different eras (e.g., 1900–1960)

5. **Photo Map View**
   - World map with GPS pins for all photos
   - Clustered pins for dense locations
   - Great for travel-heavy families

6. **Relationship Tree Overlays**
   - Modes you can toggle:
     - Genetic tree
     - Emotional tree (time spent together, photo co-appearance)
     - Location-based tree
     - Photo-density tree

### C. Photo Organization Enhancements
7. **Auto-Create Albums (AI Event Detection)**
   - Automatically detect and group: Vacations, Holidays, Multi-day trips, Graduations, Events

8. **Memory Collections (AI Grouped Events)**
   - Suggested albums such as: “Hawaii Trip 2014”, “Christmas 2001”, “High School Graduation 1998”
   - Attach collections to: A person, A couple, A family branch

### D. Family Tree Experience
9. **Family Tree Animation (Roots → Leaves Growth)**
   - The tree grows from oldest ancestors outward
   - Photos fade in
   - Relationship lines animate
   - Creates a documentary-style visual

10. **Change Node Design**
    - Support for leaf-node variants
    - Allow unique shapes / styles
    - Optional photo-frame styles
    - Modern, customizable look

### E. Collaboration & Social Features
11. **Tree Collaboration Tools**
    - Invite relatives to contribute photos
    - Role assignments: editor, viewer, contributor
    - Comments on photos
    - Version history of edits
    - “Who added what” timeline
    - Shared album links

12. **Ask Family a Question**
    - Broadcast a question to all contributors
    - Collect memories, stories, or details
    - Example: “Does anyone know who this person is?”

### F. Life Events & Personal History
13. **Life Events Model (Structured Timeline Data)**
    - Users can add structured events like: Graduation, Immigration, Marriage, Career change, Military service, Awards
    - Filters and views like: “Show all marriages from 1950–2000”, “Show all education milestones”

### G. Sensitive Data & Personal Archives
14. **Memory Vault (Encrypted Storage)**
    - Private, secure space for storing: Birth certificates, Marriage certificates, Immigration documents, Letters, Audio recordings
    - Encrypted with user’s own key

### H. Family Utility Features
15. **Events & Reminders**
    - Birthday reminders
    - Anniversary tracker
    - “This Week in Family History” feed

16. **Audio Memories**
    - Voice recordings attachable to any person
    - Useful for grandparents and oral histories

## 5. Important Files & Locations

### Frontend (`/client`)
**Key Components:**
- `src/pages/TreeDashboard.jsx` - Multi-tree management
- `src/pages/TreePage.jsx` - Main tree view
- `src/pages/Login.jsx` - Unified login
- `src/pages/Register.jsx` - Registration
- `src/components/TreeVisualizer.jsx` - React Flow tree rendering
- `src/components/TreeSwitcher.jsx` - Tree navigation dropdown
- `src/components/SidePanel.jsx` - Person editing panel
- `src/components/SearchBar.jsx` - Search & filter
- `src/components/AccountSettings.jsx` - Account management
- `src/auth.js` - Authentication utilities
- `src/mockSupabase.js` - Mock auth for local dev
- `src/utils/sessionManager.js` - Session persistence

### Backend (`/server`)
**Key Files:**
- `index.js` - Express server entry point
- `routes/api.js` - All API routes
- `middleware/auth.js` - JWT validation & Supabase clients
- `middleware/rbac.js` - Role-based access control
- `middleware/rateLimiter.js` - Rate limiting
- `middleware/auditLogger.js` - Audit logging
- `controllers/treeController.js` - Tree CRUD operations
- `controllers/personController.js` - Person CRUD + merge
- `controllers/relationshipController.js` - Relationship management
- `controllers/mediaController.js` - Media handling
- `controllers/accountController.js` - Account deletion
- `controllers/googleOAuthController.js` - Dual OAuth logic
- `mockData.js` - Mock data for local testing

### SQL Migrations (`/server/sql-prompts`)
- `schema.sql` - Initial database schema
- `complete_setup.sql` - Full setup with RLS
- `seed.sql` - Sample data for testing
- `audit_logs_migration.sql` - Audit logging table
- `rbac_migration.sql` - RBAC updates to tree_members

## 5. Environment Setup
(See README.md for full setup)

## 6. Development Workflow
(See README.md for full workflow)

## 7. API Endpoints
(See API.md for full documentation)

## 8. Security Implementation

### Authentication
- Google OAuth, Magic Links, Email/Password
- JWT tokens with auto-refresh
- Session persistence in localStorage

### Authorization (RBAC)
- **Owner:** Full access, can delete tree, manage members
- **Editor:** Can create/edit/delete content
- **Viewer:** Read-only access

### Rate Limiting
- General API: 100 req/15min
- Write operations: 30 req/15min
- Account deletion: 2 req/hour

### Audit Logging
- Tracks: CREATE, UPDATE, DELETE, VIEW actions
- Stores: user_id, action, resource_type, resource_id, IP, user agent, metadata
- Accessible via Supabase dashboard

## 9. Known Issues & Workarounds

### VPN + Google OAuth
**Issue:** Google OAuth fails when on VPN  
**Workaround:** Use mock mode (`USE_MOCK=true`)

### Supabase RLS
**Issue:** Some operations need service role key  
**Solution:** Use `supabaseAdmin` for admin operations

## 10. Next Steps

### Immediate Priorities (Phase G):
1. **Launch Preparation:** Final performance tuning and cross-browser testing.

2. **Post-Launch:** Social features (Phase G completion).

### Technical Debt:
- [ ] Complete undo/redo implementation
- [ ] Add expand/collapse for large trees
- [ ] Optimize React Flow performance for 100+ nodes
- [ ] Add comprehensive error boundaries
- [ ] Implement proper loading skeletons

### Testing:
- [ ] Unit tests for controllers
- [ ] Integration tests for API endpoints
- [ ] E2E tests for critical flows
- [ ] Performance testing for large trees

## 11. Helpful Commands

```bash
# Git
git checkout -b phase-g-collaboration
git merge main
git push origin phase-g-collaboration

# Database
# Run migrations in Supabase SQL Editor
# Check RLS policies: SELECT * FROM pg_policies;

# Debugging
# Check audit logs: SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
# Check tree members: SELECT * FROM tree_members WHERE tree_id = 'your-tree-id';
```

## 12. Resources

- **Supabase Dashboard:** https://app.supabase.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Render Dashboard:** https://dashboard.render.com
- **React Flow Docs:** https://reactflow.dev
- **Google Photos API:** https://developers.google.com/photos

---

**Last Updated:** Phase M Complete (Dec 2024)  
**Current Branch:** `feature/user-registration` (Merged to `main`)  
**Next Phase:** Launch 🚀