# API Reference

## Overview
The Family Tree API provides RESTful endpoints for managing family trees, persons, relationships, and media.

**Base URL:** 
- Production: `https://api.familytree-e.com/api`
- Development: `http://localhost:3000/api`

**Authentication:** JWT tokens via Supabase Auth
All authenticated requests require the `Authorization: Bearer <jwt_token>` header.

## Summary of Endpoints

### Trees
| Method | Endpoint | Description | Perms |
| :--- | :--- | :--- | :--- |
| GET | `/api/trees` | Get current user's trees | Auth |
| POST | `/api/trees` | Create a new family tree | Auth |
| GET | `/api/tree/:id` | Get full tree structure (persons + relationships) | Viewer |
| DELETE | `/api/tree/:id` | Delete an entire tree | Owner |

### Persons
| Method | Endpoint | Description | Perms |
| :--- | :--- | :--- | :--- |
| POST | `/api/person` | Add a new person to a tree | Editor |
| PUT | `/api/person/:id` | Update person details | Editor |
| DELETE | `/api/person/:id` | Remove a person (cascades relationships) | Editor |
| POST | `/api/person/merge` | Merge two person records | Editor |

### Relationships
| Method | Endpoint | Description | Perms |
| :--- | :--- | :--- | :--- |
| POST | `/api/relationship` | Connect two persons | Editor |
| DELETE | `/api/relationship/:id` | Remove a relationship | Editor |

### Collaboration & Members
| Method | Endpoint | Description | Perms |
| :--- | :--- | :--- | :--- |
| POST | `/api/tree/:id/invite` | Invite user via email | Editor |
| GET | `/api/invite/:token` | View invitation details (PUBLIC) | None |
| POST | `/api/invite/:token/accept` | Join a tree | Auth |
| GET | `/api/tree/:id/members` | List tree members | Owner |
| PUT | `/api/tree/:id/member/:userId` | Change member role | Owner |
| DELETE | `/api/tree/:id/member/:userId` | Remove member | Owner |

### Media
| Method | Endpoint | Description | Perms |
| :--- | :--- | :--- | :--- |
| GET | `/api/person/:id/media` | Get person's photos | Viewer |
| POST | `/api/photos` | Add photo reference (or upload) | Editor |
| PUT | `/api/photos/:id` | Update photo details | Editor |
| DELETE | `/api/photos/:id` | Remove photo | Editor |

### System & Account
| Method | Endpoint | Description | Perms |
| :--- | :--- | :--- | :--- |
| GET | `/api/export/tree/:id/json` | Export tree as JSON | Viewer |
| GET | `/api/export/tree/:id/gedcom` | Export tree as GEDCOM | Viewer |
| DELETE | `/api/account` | Permanent account deletion | Auth |

## Error Handling
Standard error response format:
```json
{
  "error": "Short error message",
  "details": "Extended details or validation array"
}
```

Common status codes:
- `400`: Validation failed
- `401`: Missing/Invalid JWT
- `403`: Insufficient RBAC role
- `429`: Rate limit exceeded

## Rate Limiting
- **General**: 100 req / 15 min
- **Writes**: 30 req / 15 min
- **Deletion**: 5 req / 15 min
- **Headers**: `X-RateLimit-Remaining`, `X-RateLimit-Reset`
