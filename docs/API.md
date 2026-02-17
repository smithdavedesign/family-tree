# API Documentation

## Overview

The Family Tree API provides RESTful endpoints for managing family trees, persons, relationships, and media.

**Base URL:** 
- Production: `https://api.familytree-e.com/api`
- Development: `http://localhost:3000/api`

**Authentication:** JWT tokens via Supabase Auth

---

## Authentication

### Headers
All authenticated requests require:
```
Authorization: Bearer <jwt_token>
```

### Getting a Token
Use Supabase client authentication:
```javascript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google'
});
```

---

## Endpoints

### Trees

#### Get User's Trees
```http
GET /api/trees
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Smith Family Tree",
    "description": "My family history",
    "created_at": "2024-01-01T00:00:00Z",
    "owner_id": "uuid"
  }
]
```

#### Create Tree
```http
POST /api/trees
```

**Request Body:**
```json
{
  "name": "New Family Tree",
  "description": "Optional description"
}
```

**Validation:**
- `name`: Required, 1-200 characters
- `description`: Optional, max 1000 characters

**Response:** `201 Created`

#### Get Tree Details
```http
GET /api/tree/:id
```

**Response:**
```json
{
  "tree": { "id": "uuid", "name": "..." },
  "persons": [...],
  "relationships": [...]
}
```

**Permissions:** Requires viewer role

#### Delete Tree
```http
DELETE /api/tree/:id
```

**Permissions:** Requires owner role

**Response:** `204 No Content`

---

### Persons

#### Create Person
```http
POST /api/person
```

**Request Body:**
```json
{
  "tree_id": "uuid",
  "first_name": "John",
  "last_name": "Doe",
  "dob": "1980-01-01",
  "dod": null,
  "gender": "Male",
  "bio": "Biography text",
  "occupation": "Engineer",
  "pob": "New York, NY"
}
```

**Validation:**
- `tree_id`: Required, valid UUID
- `first_name`: Required, 1-100 characters
- `last_name`: Optional, max 100 characters
- `dob`: Optional, ISO date, cannot be future
- `dod`: Optional, ISO date, cannot be future, must be after `dob`
- `gender`: Optional, one of: Male, Female, Other, Unknown
- Age validation: Max 150 years

**Permissions:** Requires editor role

**Response:** `201 Created`

#### Update Person
```http
PUT /api/person/:id
```

**Request Body:** Same as create (all fields optional)

**Permissions:** Requires editor role for the person's tree

**Response:** `200 OK`

#### Delete Person
```http
DELETE /api/person/:id
```

**Permissions:** Requires editor role

**Response:** `204 No Content`

**Note:** Cascade deletes all relationships

#### Merge Persons
```http
POST /api/person/merge
```

**Request Body:**
```json
{
  "keep_person_id": "uuid",
  "merge_person_id": "uuid"
}
```

**Permissions:** Requires editor role

**Response:** `200 OK`

---

### Relationships

#### Create Relationship
```http
POST /api/relationship
```

**Request Body:**
```json
{
  "tree_id": "uuid",
  "person_1_id": "uuid",
  "person_2_id": "uuid",
  "type": "parent_child",
  "status": "current"
}
```

**Validation:**
- `type`: Required, one of: parent_child, spouse, adoptive_parent_child, sibling
- `status`: Optional, one of: current, divorced, widowed, separated
- Cannot create self-relationships
- Prevents duplicate relationships

**Permissions:** Requires editor role

**Response:** `201 Created`

#### Delete Relationship
```http
DELETE /api/relationship/:id
```

**Permissions:** Requires editor role

**Response:** `204 No Content`

---

### Invitations

#### Create Invitation
```http
POST /api/tree/:treeId/invite
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "role": "editor"
}
```

**Validation:**
- `email`: Required, valid email format
- `role`: Required, one of: editor, viewer

**Permissions:** Requires editor role

**Response:** `201 Created`

#### Get Invitation
```http
GET /api/invite/:token
```

**Public endpoint** (no auth required)

**Response:**
```json
{
  "tree_name": "Smith Family Tree",
  "inviter_email": "owner@example.com",
  "role": "editor"
}
```

#### Accept Invitation
```http
POST /api/invite/:token/accept
```

**Permissions:** Requires authentication

**Response:** `200 OK`

#### Get Tree Members
```http
GET /api/tree/:treeId/members
```

**Permissions:** Requires owner role

**Response:**
```json
[
  {
    "user_id": "uuid",
    "email": "user@example.com",
    "role": "editor",
    "joined_at": "2024-01-01T00:00:00Z"
  }
]
```

#### Update Member Role
```http
PUT /api/tree/:treeId/member/:userId
```

**Request Body:**
```json
{
  "role": "viewer"
}
```

**Permissions:** Requires owner role

**Response:** `200 OK`

#### Remove Member
```http
DELETE /api/tree/:treeId/member/:userId
```

**Permissions:** Requires owner role

**Response:** `204 No Content`

---

### Photos

#### Get Person's Photos
```http
GET /api/person/:id/media
```

**Permissions:** Requires viewer role

**Response:**
```json
[
  {
    "id": "uuid",
    "url": "https://...",
    "caption": "Family photo",
    "date_taken": "2020-01-01",
    "is_primary": true
  }
]
```

#### Add Photo
```http
POST /api/photos
```

**Request Body:**
```json
{
  "person_id": "uuid",
  "url": "https://...",
  "caption": "Optional caption",
  "date_taken": "2020-01-01",
  "is_primary": false
}
```

**Permissions:** Requires editor role

**Response:** `201 Created`

#### Update Photo
```http
PUT /api/photos/:id
```

**Request Body:** Same as add (all fields optional)

**Permissions:** Requires editor role

**Response:** `200 OK`

#### Delete Photo
```http
DELETE /api/photos/:id
```

**Permissions:** Requires editor role

**Response:** `204 No Content`

---

### Export

#### Export as JSON
```http
GET /api/export/tree/:treeId/json
```

**Permissions:** Requires viewer role

**Response:** JSON file download

**Format:**
```json
{
  "metadata": {
    "exportDate": "2024-01-01T00:00:00Z",
    "version": "1.0"
  },
  "tree": {...},
  "persons": [...],
  "relationships": [...],
  "photos": [...]
}
```

#### Export as GEDCOM
```http
GET /api/export/tree/:treeId/gedcom
```

**Permissions:** Requires viewer role

**Response:** GEDCOM file download (.ged)

**Format:** GEDCOM 5.5.1 standard

---

### Account

#### Delete Account
```http
DELETE /api/account
```

**Permissions:** Requires authentication

**Response:** `204 No Content`

**Note:** Deletes all user data including trees, persons, and relationships

---

## Error Responses

### Standard Error Format
```json
{
  "error": "Error message",
  "details": [
    {
      "field": "first_name",
      "message": "First name is required"
    }
  ]
}
```

### HTTP Status Codes
- `200` OK - Request successful
- `201` Created - Resource created
- `204` No Content - Successful deletion
- `400` Bad Request - Validation error
- `401` Unauthorized - Missing/invalid token
- `403` Forbidden - Insufficient permissions
- `404` Not Found - Resource not found
- `429` Too Many Requests - Rate limit exceeded
- `500` Internal Server Error - Server error

---

## Rate Limiting

**General endpoints:** 100 requests per 15 minutes
**Write operations:** 30 requests per 15 minutes
**Account deletion:** 5 requests per 15 minutes

**Headers:**
- `X-RateLimit-Limit`: Total requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Time when limit resets

---

## Pagination

Not currently implemented. All list endpoints return full results.

**Coming soon:** Cursor-based pagination for large datasets

---

## Webhooks

Not currently implemented.

**Coming soon:** Webhook support for tree updates

---

## SDKs

### JavaScript/TypeScript
Use the Supabase client:
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Authenticate
const { data: { session } } = await supabase.auth.getSession();

// Make API request
const response = await fetch('/api/trees', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  }
});
```

---

## Examples

### Create a Complete Family
```javascript
// 1. Create tree
const tree = await fetch('/api/trees', {
  method: 'POST',
  body: JSON.stringify({ name: 'My Family' })
}).then(r => r.json());

// 2. Add parent
const parent = await fetch('/api/person', {
  method: 'POST',
  body: JSON.stringify({
    tree_id: tree.id,
    first_name: 'John',
    last_name: 'Doe'
  })
}).then(r => r.json());

// 3. Add child
const child = await fetch('/api/person', {
  method: 'POST',
  body: JSON.stringify({
    tree_id: tree.id,
    first_name: 'Jane',
    last_name: 'Doe'
  })
}).then(r => r.json());

// 4. Create relationship
await fetch('/api/relationship', {
  method: 'POST',
  body: JSON.stringify({
    tree_id: tree.id,
    person_1_id: parent.id,
    person_2_id: child.id,
    type: 'parent_child'
  })
});
```

---

## Changelog

**v1.0** (Current)
- Initial API release
- CRUD operations for trees, persons, relationships
- Photo management
- Data export (JSON/GEDCOM)
- Role-based access control
- Rate limiting
- Input validation

**Coming Soon:**
- Pagination
- Webhooks
- Advanced search
- Batch operations
