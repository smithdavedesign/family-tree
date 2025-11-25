# Role: Principal Full Stack Architect
# Project Name: "Roots & Branches" (Family Tree App)

## Objective
Build a web-based Family Tree application where users log in via Google SSO. The app allows users to create/join family trees, visualize lineage using a dynamic graph, and attach media (accessed via Google Photos Picker API) to individual nodes.

## 🛑 Constraints (Strict)
1. **Cost:** 100% Free Tier architecture.
2. **Deployment:** - Frontend: Vercel (Free)
   - Backend: Render.com (Free Web Service)
   - Database: Supabase (Free PostgreSQL)
   - avaiable tables: users, trees, tree_members, persons, relationships, media.
3. **Tech Stack:**
   - Frontend: React (Vite), TailwindCSS, React Flow (for the tree visualization).
   - Backend: Node.js, Express.
   - Auth:Supabase Auth. .env setup complete. example auth use case in client/src/auth.js
   - API Style: REST.

## 1. Architecture & Data Schema
**Database (PostgreSQL via Supabase):**
Create a schema with the following tables:
- `users`: (id, google_id, email, avatar_url, created_at)
- `trees`: (id, name, owner_id, is_public)
- `tree_members`: (tree_id, user_id, role [viewer/editor])
- `persons`: (id, tree_id, first_name, last_name, dob, dod, pob, gender, bio, occupation, profile_photo_url, attributes JSONB for dynamic data)
- `relationships`: (id, tree_id, person_1_id, person_2_id, type [parent_child, spouse])
- `media`: (id, person_id, url, type, google_media_id)

## 2. Core Feature Implementation Guide

### Phase A: Backend & Auth
- Initialize a Node.js/Express server.
- implement Google OAuth 2.0. 
- **Crucial:** Request scopes for `profile`, `email`, and `https://www.googleapis.com/auth/photoslibrary.readonly` (to access Google Photos later).
- Create REST endpoints:
  - `GET /api/tree/:id` (Fetch full tree nodes and edges)
  - `POST /api/person` (Create node)
  - `PUT /api/person/:id` (Update details)
  - `POST /api/relationship` (Link nodes)

### Phase B: Frontend Visualization (The "Antigravity" Logic)
- Use **React Flow** (or React Force Graph) to render the tree.
- **Node Design:** Custom Node component showing Photo, Name, Birth-Death years.
- **Layout:** Use `dagre` or `elkjs` to automatically calculate the hierarchical tree layout so nodes don't overlap.
- **Interactions:**
  - Click node -> Open Side Panel (Details/Edit view).
  - Drag canvas -> Pan.
  - Scroll -> Zoom.

### Phase C: Google Integration
- Implement a "Media Picker" in the frontend.
- When clicking "Add Photo," call the Google Photos API to fetch the user's recent photos and allow selection.
- Save the permanent URL (or reference ID) to the database `media` table.

## 3. Step-by-Step Execution Plan
Please start by generating the **SQL Schema code** for Supabase and the **Project Directory Structure** for the Node/React monorepo.