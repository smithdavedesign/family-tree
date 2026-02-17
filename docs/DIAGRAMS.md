# Complex Process Diagrams

## Authentication Flow (Dual OAuth)

This diagram illustrates the separation between application login and third-party service integration.

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Supabase
    participant Backend
    participant Google

    %% Primary Auth
    Note over User, Google: Phase 1: Application Login
    User->>Frontend: Clicks "Sign In with Google"
    Frontend->>Supabase: Auth Request (OpenID, Email)
    Supabase->>Google: OAuth Handshake
    Google-->>Supabase: Returns ID Token
    Supabase-->>Frontend: Returns Session (JWT)
    Frontend->>Frontend: Store Session in LocalStorage

    %% API Requests
    Note over User, Google: Phase 2: Secure API Access
    User->>Frontend: View Tree
    Frontend->>Backend: GET /api/trees (Header: Bearer JWT)
    Backend->>Supabase: Verify JWT
    Supabase-->>Backend: Token Valid + User ID
    Backend->>Backend: Check RBAC
    Backend-->>Frontend: Return Data

    %% Secondary Auth (Service Integration)
    Note over User, Google: Phase 3: Google Photos Integration
    User->>Frontend: Connect Google Photos
    Frontend->>Backend: Request Auth URL (Scope: photoslibrary.readonly)
    Backend-->>Frontend: Return Google Consent URL
    Frontend->>Google: Redirect User
    User->>Google: Grants Permission
    Google->>Backend: Callback with Code
    Backend->>Google: Exchange Code for Refresh Token
    Backend->>Backend: Store Refresh Token in DB (Encrypted)
    Backend-->>Frontend: Connection Success
```

## Tree Data Fetching & Rendering

How the application loads and displays the complex family tree structure.

```mermaid
flowchart TD
    A[Client: TreePage Mounts] --> B{Have Tree ID?}
    B -->|Yes| C[API: GET /api/tree/:id]
    B -->|No| D[Redirect to Dashboard]
    
    C --> E[Backend: Fetch Tree Metadata]
    E --> F["Backend: Fetch Persons (Array)"]
    F --> G["Backend: Fetch Relationships (Array)"]
    G --> H[Return JSON Payload]
    
    H --> I[Client: React Query Cache]
    I --> J[Data Parser Hook]
    
    subgraph "Client: Data Transformation"
        J --> K[Map Persons to React Flow Nodes]
        J --> L[Map Relationships to React Flow Edges]
        K --> M["Layout Engine (Dagre)"]
        L --> M
        M --> N[Calculate X/Y Coordinates]
    end
    
    N --> O[React Flow Renderer]
    O --> P[User Sees Tree]
```

## Image Upload Pipeline

The process for handling user uploads securely and optimizing them for performance.

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant API
    participant Sharp
    participant Storage
    participant DB

    User->>Client: Selects Photo (Select File)
    Client->>Client: Validate Size/Type
    Client->>API: POST /api/photos (FormData)
    
    rect rgb(240, 248, 255)
        Note right of API: Backend Processing
        API->>Sharp: Buffer Stream
        Sharp->>Sharp: Resize (Max 1200px)
        Sharp->>Sharp: Convert to WebP (80% Quality)
        Sharp-->>API: Optimized Buffer
    end
    
    API->>Storage: Upload (Bucket: 'photos')
    Storage-->>API: Public URL
    
    API->>DB: INSERT into media table
    DB-->>API: New Media Record
    API-->>Client: Return Media Object
    
    Client->>Client: Optimistic UI Update
```
