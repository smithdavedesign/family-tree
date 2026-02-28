# Architecture & Complex Code Guide

This document provides an architectural overview of the Roots & Branches application with detailed documentation of the most complex code areas. It serves as a reference for understanding system design decisions and navigating the codebase.

---

## System Architecture

```mermaid
graph TB
    subgraph "Client Layer - Vercel"
        direction TB
        VITE["Vite Dev Server / Build"]
        APP["App.jsx<br/>Route Definitions"]
        subgraph "Pages (22)"
            LOGIN["Login / Register"]
            DASH["TreeDashboard"]
            TREE_PG["TreePage"]
            PERSON_PG["PersonPage"]
            TIMELINE_PG["TimelinePage"]
            GALLERY_PG["GalleryPage"]
            MAP_PG["TreeMapPage"]
            ALBUM_PG["AlbumsPage"]
            STORY_PG["StoryPage"]
            SETTINGS_PG["AccountSettings"]
        end
        subgraph "Core Components"
            TV["TreeVisualizer<br/>(React Flow + Dagre)"]
            SP["SidePanel<br/>(Person Details)"]
            PL["PhotoLightbox<br/>(Gallery Viewer)"]
            SM["ShareModal<br/>(Collaboration)"]
            ARM["AddRelationshipModal"]
        end
        subgraph "Libraries"
            REACTFLOW["React Flow v11"]
            DAGRE["Dagre (Layout)"]
            LEAFLET["Leaflet + Heat"]
            TIPTAP["TipTap (Rich Text)"]
            RQ["React Query v5"]
            ZOD["Zod v4"]
        end
    end

    subgraph "Server Layer - Render"
        direction TB
        EXPRESS["Express.js v5"]
        subgraph "Middleware Pipeline"
            direction LR
            HELMET["Helmet<br/>(Security Headers)"]
            CORS_MW["CORS"]
            AUTH_MW["JWT Auth<br/>(Supabase verify)"]
            RBAC_MW["RBAC<br/>(Role Check)"]
            RATE_MW["Rate Limiter<br/>(Tiered)"]
            AUDIT_MW["Audit Logger"]
            VAL_MW["Joi Validator"]
        end
        subgraph "Controllers (16)"
            TC["treeController"]
            PC["personController"]
            RC["relationshipController"]
            MC["mediaController"]
            DC["documentController"]
            SC["storyController"]
            LEC["lifeEventController"]
            AC["albumController"]
            CC["commentController"]
            LC["locationController"]
            MAPC["mapController"]
            REM["reminderController"]
            GOAUTH["googleOAuthController"]
            ACCT["accountController"]
        end
    end

    subgraph "Data Layer - Supabase"
        direction TB
        PG["PostgreSQL"]
        subgraph "Core Tables"
            TREES["trees"]
            PERSONS["persons"]
            RELS["relationships"]
            MEMBERS["tree_members"]
        end
        subgraph "Content Tables"
            PHOTOS["photos"]
            DOCS["documents"]
            STORIES["stories"]
            EVENTS["life_events"]
            ALBUMS_T["albums"]
            ALBUM_PHOTOS["album_photos"]
            COMMENTS["comments"]
        end
        subgraph "Location Tables"
            LOCS["locations"]
            STORY_LOCS["story_locations"]
            PERSON_LOCS["person_locations"]
            EVENT_LOCS["life_event_locations"]
        end
        subgraph "Auth & Security"
            USERS["users"]
            GCONN["google_connections"]
            INVITES["invitations"]
            LOGS["audit_logs"]
        end
        RLS_LAYER["Row Level Security"]
        STORAGE["Supabase Storage<br/>(documents bucket)"]
    end

    subgraph "External APIs"
        GOOGLE_AUTH["Google OAuth 2.0"]
        GOOGLE_DRIVE["Google Drive API"]
        GOOGLE_PHOTOS["Google Photos API"]
        GEOCODE_API["Geocoding<br/>(Nominatim / Google Maps)"]
    end

    APP --> EXPRESS
    EXPRESS --> HELMET --> CORS_MW --> AUTH_MW --> RBAC_MW --> RATE_MW --> AUDIT_MW --> VAL_MW
    VAL_MW --> TC & PC & RC & MC & DC & SC & LEC & AC & CC & LC & MAPC & REM & GOAUTH & ACCT
    TC & PC & RC & MC --> PG
    DC & SC & LEC & AC & CC & LC --> PG
    MAPC & REM & GOAUTH & ACCT --> PG
    GOAUTH --> GOOGLE_AUTH
    MC --> GOOGLE_PHOTOS
    DC --> GOOGLE_DRIVE
    MAPC --> GEOCODE_API
    PG --> RLS_LAYER
```

---

## Request Lifecycle

Every API request flows through the following middleware pipeline in order:

```mermaid
sequenceDiagram
    participant C as Client
    participant H as Helmet
    participant CO as CORS
    participant A as Auth
    participant R as RBAC
    participant RL as Rate Limiter
    participant V as Validator
    participant AL as Audit Log
    participant CT as Controller
    participant DB as Supabase

    C->>H: Request
    H->>CO: Security headers added
    CO->>A: CORS validated
    A->>A: Verify JWT with Supabase
    A->>R: req.user populated
    R->>R: Check tree_members role
    R->>RL: Role verified
    RL->>RL: Check request count
    RL->>V: Under limit
    V->>V: Validate body with Joi schema
    V->>AL: Valid input
    AL->>CT: Log action to audit_logs
    CT->>DB: Execute query
    DB-->>CT: Data
    CT-->>C: JSON response
```

---

## Complex Code Areas

### 1. TreeVisualizer — Layout Engine (970 lines)

**File:** `client/src/components/TreeVisualizer.jsx`

The tree layout uses [Dagre](https://github.com/dagrejs/dagre) to compute hierarchical positions from raw person/relationship data. The layout flow:

```mermaid
flowchart TD
    A["Raw persons & relationships<br/>(from API)"] --> B["Convert to React Flow<br/>nodes & edges"]
    B --> C["Apply Dagre layout<br/>(TB or LR direction)"]
    C --> D["Position nodes with<br/>x, y coordinates"]
    D --> E["Render React Flow<br/>canvas"]
    E --> F{"User interaction?"}
    F -->|Click node| G["Open SidePanel"]
    F -->|Right-click| H["Context Menu"]
    F -->|Keyboard| I["Arrow Key Navigation"]
    F -->|Toggle focus| J["Focus Mode Filter"]
    J --> K["Recursive graph walk<br/>to find connected nodes"]
    K --> L["Hide unconnected nodes"]
    L --> E
```

#### Focus Mode Algorithm
The focus mode recursively walks the graph to find all ancestors and descendants of a selected person:

```javascript
// Simplified focus mode logic
function getConnected(nodeId, direction) {
  const visited = new Set();
  const queue = [nodeId];
  while (queue.length > 0) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);
    // Find edges where current is source (descendants) or target (ancestors)
    edges.forEach(edge => {
      if (direction === 'down' && edge.source === current) queue.push(edge.target);
      if (direction === 'up' && edge.target === current) queue.push(edge.source);
    });
  }
  return visited;
}
// Union of ancestors + descendants = visible nodes
const visible = new Set([...getConnected(id, 'up'), ...getConnected(id, 'down')]);
```

#### Undo/Redo Pattern
Uses a simplified command pattern with history stack:
- `addToHistory(action)` — Pushes `{type, data, timestamp}` to history array
- `handleUndo()` — Pops from history, applies reverse operation
- `handleRedo()` — Pops from redo stack, re-applies operation
- History is capped at 50 entries

---

### 2. SidePanel — Person Detail Manager (967 lines)

**File:** `client/src/components/SidePanel.jsx`

This component orchestrates 8 distinct concerns for a single person:

```mermaid
flowchart LR
    SP["SidePanel"] --> PV["Profile View<br/>(read mode)"]
    SP --> PE["Edit Form<br/>(write mode)"]
    SP --> PU["Photo Upload<br/>(Google + Local)"]
    SP --> PG["PhotoGallery"]
    SP --> DG["DocumentGallery"]
    SP --> RS["Relationships<br/>(list + add)"]
    SP --> LE["Life Events<br/>(display)"]
    SP --> ST["Stories<br/>(display)"]
```

#### Photo Upload Flow
The component handles two distinct upload paths:

```mermaid
sequenceDiagram
    participant U as User
    participant SP as SidePanel
    participant GP as Google Photos API
    participant API as Backend
    participant DB as Database

    alt Google Photos Upload
        U->>SP: Click "Google Photos"
        SP->>GP: Open picker (photoslibrary.readonly)
        GP-->>SP: Selected photo URLs
        SP->>API: POST /api/photos (url, person_id)
        API->>DB: Insert into photos table
    else Local File Upload
        U->>SP: Click "Upload" / drag file
        SP->>SP: FileReader / validate
        SP->>API: POST /api/media (base64 data)
        API->>DB: Insert into media table
    end
```

> ⚠️ **Known Issue:** These two paths write to different tables (`photos` vs `media`). The `media` path is legacy and the `photos` path is the canonical system. See the audit report for details.

---

### 3. RBAC Middleware — Role Hierarchy

**File:** `server/middleware/rbac.js`

The RBAC system uses a numeric hierarchy to determine access:

```mermaid
graph LR
    subgraph "Role Hierarchy"
        direction LR
        O["Owner (3)"] --> E["Editor (2)"] --> V["Viewer (1)"]
    end
```

**How it works:**
1. `requireTreeRole(requiredRole)` is a factory that returns middleware
2. The middleware extracts `treeId` from route params (tries `:treeId`, `:id`, or body)
3. Queries `tree_members` for the user's role in that tree
4. Also checks if user is the tree's `owner_id` (implicit owner even without a `tree_members` row)
5. Compares role hierarchy: `user_role_level >= required_role_level`

**Resource-specific variants** (photos, documents, events, stories) extract the `tree_id` through the resource:
```
Photo → person_id → persons.tree_id → tree_members check
```

---

### 4. Dual OAuth Architecture

**File:** `server/controllers/googleOAuthController.js`, `server/routes/googleOAuth.js`

The application uses **two separate OAuth flows** by design:

```mermaid
flowchart TD
    subgraph "OAuth 1: Authentication"
        L["Login Page"] --> SA["Supabase Auth"]
        SA --> G1["Google OAuth<br/>(openid email profile)"]
        G1 --> JWT["JWT Token"]
        JWT --> APP["App Access"]
    end

    subgraph "OAuth 2: API Integration"
        SET["Settings Page"] --> C["Connect Google"]
        C --> G2["Custom OAuth<br/>(drive.file + photoslibrary.readonly)"]
        G2 --> TOKEN["Access + Refresh Token"]
        TOKEN --> GC["google_connections table"]
        GC --> DRIVE["Google Drive Picker"]
        GC --> PHOTOS["Google Photos Picker"]
    end

    APP -.->|"User triggers manually"| SET
```

**Why two flows?** Supabase's `provider_token` (for API access) is ephemeral and lost on session refresh. The dual pattern stores API tokens independently in `google_connections`, with automatic refresh via `getValidToken`.

---

### 5. Map Controller — Haversine Distance

**File:** `server/controllers/mapController.js`

The `getNearbyPhotos` endpoint uses the Haversine formula to find photos within a geographic radius. The `getPersonLocationStats` function aggregates locations from 4 different sources:

```mermaid
flowchart TD
    A["getPersonLocationStats(personId)"] --> B["Fetch person vitals<br/>(birth/death places)"]
    A --> C["Fetch photos<br/>(with GPS coords)"]
    A --> D["Fetch life events<br/>(with locations)"]
    A --> E["Fetch stories<br/>(with linked locations)"]

    B --> F["Parse location strings<br/>+ geocode if needed"]
    C --> G["Extract photo GPS<br/>metadata"]
    D --> H["Get event location<br/>coordinates"]
    E --> I["Get story_locations<br/>join data"]

    F & G & H & I --> J["Aggregate all<br/>location points"]
    J --> K["Calculate statistics:<br/>unique places, travel distance,<br/>furthest from birth"]
```

---

### 6. Location System — Normalized Architecture

**File:** `server/controllers/locationController.js`

Locations use a normalized design with join tables for many-to-many relationships:

```mermaid
erDiagram
    locations {
        uuid id PK
        string name
        string address
        float latitude
        float longitude
        date start_date
        date end_date
        text notes
    }

    stories ||--o{ story_locations : "linked via"
    story_locations }o--|| locations : "references"

    persons ||--o{ person_locations : "lived at"
    person_locations }o--|| locations : "references"
    person_locations {
        string location_type
        date start_date
        date end_date
        text notes
    }

    life_events ||--o{ life_event_locations : "occurred at"
    life_event_locations }o--|| locations : "references"

    photos ||--o{ locations : "taken at (via coords)"
```

---

### 7. Validation Layer — Custom Validators

**File:** `server/validation/schemas.js`

Beyond standard field validation, the system includes domain-specific logic:

| Validator | Logic |
|-----------|-------|
| **Impossible date detection** | Checks if `dod` (death) is before `dob` (birth) |
| **Age validation** | Max 150 years between birth and today |
| **Self-relationship prevention** | `person_1_id !== person_2_id` |
| **Future date prevention** | No dates after current date |
| **Occupation history** | Accepts both array of strings and comma-separated string |

---

### 8. Export System — GEDCOM Generation

**File:** `server/routes/export.js`

The GEDCOM export generates GEDCOM 5.5.1 format (industry standard for genealogy):
- Outputs `INDI` records for persons with `NAME`, `BIRT`, `DEAT`, `BURI`, `OCCU` tags
- Outputs `FAM` records for spouse relationships
- Handles date format conversion (ISO → GEDCOM: `01 JAN 1980`)
- Sets download headers for browser file download

---

### 9. Reminder Engine — Date Window Matching

**File:** `server/controllers/reminderController.js`

The upcoming events engine scans all persons/events for dates matching a 30-day window. It handles month boundary wrapping (e.g., January 20 → February 19):

```javascript
// Month boundary logic
if (currentMonth === nextMonthMonth) {
  // Same month: simple range check
  return month === currentMonth && day >= currentDay && day <= nextMonthDay;
} else {
  // Crosses month boundary: check either month
  if (month === currentMonth && day >= currentDay) return true;
  if (month === nextMonthMonth && day <= nextMonthDay) return true;
  return false;
}
```

---

### 10. Database Schema

```mermaid
erDiagram
    users ||--o{ trees : "owns"
    users ||--o{ tree_members : "belongs to"
    users ||--o{ google_connections : "has"
    users ||--o{ comments : "writes"

    trees ||--o{ persons : "contains"
    trees ||--o{ relationships : "has"
    trees ||--o{ tree_members : "has"
    trees ||--o{ invitations : "generates"
    trees ||--o{ albums : "organizes"
    trees ||--o{ audit_logs : "tracks"
    trees ||--o{ stories : "contains"
    trees ||--o{ comments : "has"

    persons ||--o{ photos : "has"
    persons ||--o{ documents : "has"
    persons ||--o{ life_events : "experiences"
    persons ||--o{ person_locations : "visited"
    persons ||--o{ stories : "featured in"
    persons ||--o{ comments : "about"

    photos ||--o{ album_photos : "in"
    albums ||--o{ album_photos : "contains"

    stories ||--o{ story_locations : "set in"
    life_events ||--o{ life_event_locations : "at"

    relationships {
        uuid person_1_id FK
        uuid person_2_id FK
        string type
        string status
    }

    tree_members {
        uuid user_id FK
        uuid tree_id FK
        string role
    }
```

---

*Last updated: February 2026*
