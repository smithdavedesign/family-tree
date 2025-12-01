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
- ✅ **Google Photos Integration** - Attach photos directly from your Google Photos library
- ✅ **Real-time Editing** - Add, edit, and link family members instantly
- ✅ **Multi-Tree Support** - Create and manage multiple family trees
- ✅ **Responsive Design** - Works seamlessly on desktop and mobile devices

### Advanced Features
- ✅ **Role-Based Access Control** - Owner, Editor, and Viewer permissions
- ✅ **Search & Filter** - Find family members by name or year range
- ✅ **Multiple Relationship Types** - Support for biological, adoptive, and step relationships
- ✅ **Merge Duplicates** - Consolidate duplicate person entries
- ✅ **Rate Limiting** - Protection against API abuse
- ✅ **Audit Logging** - Track all user actions for security and compliance

## 🛠 Tech Stack

- **Frontend:** React, Vite, TailwindCSS, React Flow
- **Backend:** Node.js, Express
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Supabase Auth (Google OAuth + Magic Links)
- **Deployment:** Vercel (Frontend), Render (Backend)

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

### ✅ Phase C: Google Integration (100%)
- [x] Media picker
- [x] Google Photos API
- [x] Media storage
- [x] Mock data layer

### ⚠️ Phase D: Editing & Management (90%)
- [x] Tree creation flow
- [x] Edit person details
- [x] Add/delete persons
- [x] Relationship management
- [x] Multiple marriages/partnerships
- [x] Adoptive/step relationships
- [ ] Undo/Redo (partial)
- [ ] Expand/collapse nodes

### ⚠️ Phase E: Polish & UX (95%)
- [x] Auto-refresh on changes
- [x] Loading states & error handling
- [x] Responsive design
- [x] Search & filter
- [x] Highlight selected lineage
- [ ] Expand/collapse nodes
- [x] **UI/UX Enhancement (Production Ready)** (100%)
  - [x] Design system setup (Tailwind config, Inter font, design tokens)
  - [x] Core component library (Button, Input, Modal, Toast, Avatar)
  - [x] Component migration (SidePanel, all modals)
  - [x] Navigation enhancements (Navbar, TreeSwitcher, Breadcrumbs, Sidebar)
  - [x] Tree visualization polish (Modern nodes, MiniMap, Connection lines)
  - [x] Animations & micro-interactions (Transitions, Hover effects)
  - [x] Accessibility & Dark Mode (Deferred to future phase)

- [x] **Tree Visualization Enhancements** (100%)
  - [x] Mini-map view
  - [x] Auto-avoid overlapping nodes
  - [x] Animated transitions
  - [x] Zoom-to-fit & Center-on-person
  - [x] Photo thumbnails in nodes

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

### ✅ Phase G: Collaboration & Sharing (100%)
- [x] Share tree via email/link
- [x] Permission levels (Owner, Editor, Viewer)
- [x] Invite collaborators
- [x] Track who added/edited what
- [ ] Connect trees between users
- [ ] Mark private/sensitive profiles

### 🚧 Phase H: Data Structure Enhancements (0%)
- [ ] Expand person details (birthplace, deathplace)
- [ ] Photo gallery per person
- [ ] Biography/notes expansion
- [ ] Sources/documents (Google Drive)
- [ ] Half-siblings support
- [ ] Divorce/separated status
- [ ] Auto-infer relationships
- [ ] Detect impossible relationships

### 🚧 Phase I: Tree Visualization Enhancements (0%)
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

### 🚧 Phase J: Analytics & Timeline (0%)
- [ ] Family timeline (chronological events)
- [ ] Scrollable timeline with event dots
- [ ] Filter by family side (maternal/paternal)
- [ ] Age distribution stats
- [ ] Most common locations
- [ ] Family branches visualization

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

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Current Status:** Phase G Complete (Collaboration) | Next: Phase E (UI/UX Enhancement)
