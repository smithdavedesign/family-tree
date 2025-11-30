# Role: Principal Full Stack Architect
# Project Name: "Roots & Branches" (Family Tree App)

## Objective
Build a web-based Family Tree application where users log in via Google SSO or email magic links. The app allows users to create/manage multiple family trees, visualize lineage using a dynamic graph, collaborate with other users, and attach media from Google Photos to individual nodes.

## 🛑 Constraints (Strict)
1. **Cost:** 100% Free Tier architecture.
2. **Deployment:** 
   - Frontend: Vercel (Free)
   - Backend: Render.com (Free Web Service)
   - Database: Supabase (Free PostgreSQL)
3. **Tech Stack:**
   - Frontend: React (Vite), TailwindCSS, React Flow (for tree visualization)
   - Backend: Node.js, Express
   - Auth: Supabase Auth (Google OAuth + Magic Links)
   - API Style: REST

## 📊 Current Project Status

**Overall Progress:** ~60% Complete | **Current Phase:** Phase F Complete ✅ | **Next:** Phase G (Collaboration)

### Completed Phases:
- ✅ **Phase A:** Backend & Auth (100%)
- ✅ **Phase B:** Frontend Visualization (100%)
- ✅ **Phase C:** Google Integration (100%)
- ⚠️ **Phase D:** Editing & Management (90%)
- ✅ **Phase E:** Polish & UX (90%)
- ✅ **Phase F:** Session, Account & Security (100%) 🎉

### In Progress / Upcoming:
- 🚧 **Phase G:** Collaboration & Sharing (0%)
- 🚧 **Phase H:** Data Structure Enhancements (0%)
- 🚧 **Phase I:** Tree Visualization Enhancements (0%)
- 🚧 **Phase J:** Analytics & Timeline (0%)

## 1. Architecture & Data Schema

**Database (PostgreSQL via Supabase):**

Available tables:
- `users`: (id, google_id, email, avatar_url, created_at)
- `trees`: (id, name, owner_id, is_public, created_at)
- `tree_members`: (tree_id, user_id, role [owner/editor/viewer])
- `persons`: (id, tree_id, first_name, last_name, dob, dod, pob, gender, bio, occupation, profile_photo_url, attributes JSONB)
- `relationships`: (id, tree_id, person_1_id, person_2_id, type [parent_child, spouse, adoptive_parent_child, step_parent_child])
- `media`: (id, person_id, url, type, google_media_id)
- `audit_logs`: (id, user_id, action, resource_type, resource_id, ip_address, user_agent, status_code, metadata JSONB, created_at)

**Key SQL Migrations:**
- `server/sql-prompts/schema.sql` - Initial schema
- `server/sql-prompts/complete_setup.sql` - Full setup with RLS
- `server/sql-prompts/audit_logs_migration.sql` - Audit logging
- `server/sql-prompts/rbac_migration.sql` - Role-based access control

## 2. Core Features Implemented

### ✅ Authentication & Security
- Google OAuth 2.0 (with Google Photos scope)
- Email magic links (passwordless)
- Password reset flow
- Persistent sessions with auto-refresh
- JWT validation middleware
- Rate limiting (tiered: 100/15min general, 30/15min writes, 2/hour account deletion)
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

### ✅ Google Photos Integration
- Photos Picker API integration
- Attach photos to persons
- Store media references in database
- Mock mode for local development (VPN bypass)

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

### Phase D: Editing & Management ⚠️ (90%)
- [x] Tree creation flow
- [x] Edit person details (side panel)
- [x] Add person (context menu)
- [x] Add/delete relationships
- [x] Multiple marriages/partnerships
- [x] Adoptive/step relationships
- [x] Merge duplicates
- [ ] Undo/Redo (partial implementation)
- [ ] Expand/collapse nodes

### Phase E: Polish & UX ✅ (90%)
- [x] Auto-refresh on changes
- [x] Loading states & error handling
- [x] Responsive design
- [x] Search & filter
- [x] Highlight selected lineage
- [ ] Expand/collapse nodes

### Phase F: Session, Account & Security ✅ (100%)
- [x] Persistent login across reloads
- [x] Session expiration & silent refresh
- [x] Account deletion flow
- [x] Auth error page
- [x] Multi-tree navigation (dashboard + switcher)
- [x] Email-based recovery (magic links)
- [x] Role-based access control (RBAC)
- [x] Secure server-side Supabase client
- [x] API middleware JWT validation
- [x] Rate limiting on sensitive endpoints
- [x] Logging & audit trail

### Phase G: Collaboration & Sharing 🚧 (Next Up!)
- [ ] Share tree via email/link
- [ ] Permission levels (Owner, Editor, Viewer) - **Foundation ready via RBAC**
- [ ] Invite collaborators
- [ ] Track who added/edited what - **Foundation ready via audit logs**
- [ ] Connect trees between users
- [ ] Mark private/sensitive profiles

### Phase H: Data Structure Enhancements 🚧
- [ ] Expand person details (birthplace, deathplace)
- [ ] Photo gallery per person
- [ ] Biography/notes expansion
- [ ] Sources/documents (Google Drive integration)
- [ ] Half-siblings support
- [ ] Divorce/separated status
- [ ] Auto-infer relationships
- [ ] Detect impossible relationships

### Phase I: Tree Visualization Enhancements 🚧
- [ ] Horizontal & vertical layout toggle
- [ ] Focused mode (ancestors/descendants only)
- [ ] Mini-map view
- [ ] Auto-avoid overlapping nodes
- [ ] Animated transitions
- [ ] Zoom-to-fit
- [ ] Center-on-person
- [ ] Keyboard navigation
- [ ] Photo thumbnails in nodes
- [ ] Lightbox for full photo view

### Phase J: Analytics & Timeline 🚧
- [ ] Family timeline (chronological events)
- [ ] Scrollable timeline with event dots
- [ ] Filter by family side (maternal/paternal)
- [ ] Age distribution stats
- [ ] Most common locations
- [ ] Family branches visualization

## 4. Important Files & Locations

### Frontend (`/client`)
**Key Components:**
- `src/pages/TreeDashboard.jsx` - Multi-tree management
- `src/pages/TreePage.jsx` - Main tree view
- `src/pages/MagicLinkAuth.jsx` - Email authentication
- `src/pages/ResetPassword.jsx` - Password reset
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
- `mockData.js` - Mock data for local testing

### SQL Migrations (`/server/sql-prompts`)
- `schema.sql` - Initial database schema
- `complete_setup.sql` - Full setup with RLS policies
- `seed.sql` - Sample data for testing
- `audit_logs_migration.sql` - Audit logging table
- `rbac_migration.sql` - RBAC updates to tree_members

## 5. Environment Setup

### Client `.env` (Vite)
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_USE_MOCK=true  # For local dev without VPN
```

### Server `.env`
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
USE_MOCK=true  # For local dev without VPN
PORT=3000
```

## 6. Development Workflow

### Local Development
```bash
# Terminal 1 - Client
cd client
npm run dev  # Runs on http://localhost:5173

# Terminal 2 - Server
cd server
node index.js  # Runs on http://localhost:3000
```

### Mock Mode
- Set `VITE_USE_MOCK=true` (client) and `USE_MOCK=true` (server)
- Bypasses Google OAuth (useful when on VPN)
- Uses mock Supabase client
- Auto-login as mock user

### Git Workflow
- `main` - Production-ready code
- `phase-*` - Feature branches for each phase
- Always merge to main after phase completion

## 7. API Endpoints

### Trees
- `GET /api/trees` - Get all user's trees
- `POST /api/trees` - Create new tree
- `GET /api/tree/:id` - Get tree with persons & relationships
- `DELETE /api/tree/:id` - Delete tree (owner only)

### Persons
- `POST /api/person` - Create person (editor+)
- `PUT /api/person/:id` - Update person (editor+)
- `DELETE /api/person/:id` - Delete person (editor+)
- `POST /api/person/merge` - Merge duplicates (editor+)
- `GET /api/person/:id/media` - Get person's media (viewer+)

### Relationships
- `POST /api/relationship` - Create relationship (editor+)
- `DELETE /api/relationship/:id` - Delete relationship (editor+)

### Media
- `POST /api/media` - Add media to person (editor+)

### Account
- `DELETE /api/account` - Delete account with cascade

**Note:** All endpoints require authentication. Write operations have rate limiting.

## 8. Security Implementation

### Authentication
- Google OAuth via Supabase
- Email magic links (passwordless)
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

### Empty Tree State
**Issue:** New trees might not create root person  
**Solution:** "Add First Person" button implemented in TreeVisualizer

### Supabase RLS
**Issue:** Some operations need service role key  
**Solution:** Use `supabaseAdmin` for admin operations

## 10. Next Steps for Future Sessions

### Immediate Priorities (Phase G):
1. **Share Tree Feature**
   - Generate shareable links
   - Email invitations
   - Accept/decline invitations

2. **Collaboration UI**
   - Member management modal
   - Role assignment interface
   - Activity feed (who did what)

3. **Privacy Controls**
   - Mark persons as private
   - Hide sensitive information from viewers
   - Tree-level privacy settings

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

**Last Updated:** Phase F Complete (Nov 2024)  
**Current Branch:** `main`  
**Next Phase:** Phase G - Collaboration & Sharing