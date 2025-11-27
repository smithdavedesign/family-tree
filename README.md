# Roots & Branches - Family Tree App

Roots & Branches is a modern, interactive family tree application that allows users to visualize their lineage, manage family members, and enrich their history with photos from Google Photos.

## 🚀 Deployment Status

- **Frontend (Vercel):** [https://family-tree-blue-kappa.vercel.app/](https://family-tree-blue-kappa.vercel.app/)
- **Backend (Render):** [https://family-tree-yogh.onrender.com/](https://family-tree-yogh.onrender.com/)

## ✨ Features

- **Interactive Graph Visualization:** Dynamic family tree layout using React Flow and Dagre.
- **Google Authentication:** Secure sign-in with Google SSO.
- **Google Photos Integration:** Directly attach photos from your Google Photos library to family members.
- **Real-time Editing:** Add, edit, and link family members instantly.
- **Responsive Design:** Works seamlessly on desktop and mobile devices.

## 🛠 Tech Stack

- **Frontend:** React, Vite, TailwindCSS, React Flow
- **Backend:** Node.js, Express
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Supabase Auth (Google OAuth)
- **Deployment:** Vercel (Frontend), Render (Backend)

## 🔌 API Endpoints

### Trees
- `GET /api/trees` - Fetch all trees owned by the current user.
- `GET /api/tree/:id` - Fetch a specific tree with all its persons and relationships.

### Persons
- `POST /api/person` - Create a new person node.
- `PUT /api/person/:id` - Update a person's details (name, bio, dates, etc.).
- `GET /api/person/:id/media` - Fetch attached media for a person.

### Relationships
- `POST /api/relationship` - Create a link between two persons (parent-child or spouse).

### Media
- `POST /api/media` - Attach a photo to a person.

## 💻 Local Development

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/smithdavedesign/family-tree.git
    cd family-tree
    ```

2.  **Setup Environment Variables:**
    - Create `.env` in `client/` and `server/` based on the provided examples.

3.  **Start the Client:**
    ```bash
    cd client
    npm install
    npm run dev
    ```

4.  **Start the Server:**
    ```bash
    cd server
    npm install
    node index.js
    ```
