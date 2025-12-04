# Google OAuth Verification - Scope Justification

## Application: Roots & Branches - Family Tree Application

### Requested Scopes and Justification

#### 1. `.../auth/photoslibrary.readonly`
**User-facing description:** View your Google Photos library

**How it will be used:**
This scope allows users to select photos from their Google Photos library to add to family tree member profiles. When a user clicks "Add Photo from Google Photos" for a family member, they can browse and select existing photos from their Google Photos collection without needing to download and re-upload them. This provides a seamless experience for users who already have family photos stored in Google Photos.

**Why it's necessary:**
- Users often have family photos already stored in Google Photos
- Eliminates the need to download photos locally and re-upload them
- Provides a better user experience by integrating with existing photo storage
- Photos are only accessed when explicitly selected by the user through the Google Picker UI
- We only request READ-ONLY access - we never modify or delete user photos

**Data usage:**
- We only access photo metadata (URL, filename, MIME type) for photos the user explicitly selects
- No bulk photo access or scanning of the user's entire library
- Photo URLs are stored in our database to display the selected photos on family tree profiles
- Users maintain full control over which photos are selected

#### 2. `.../auth/photoslibrary.appendonly`
**User-facing description:** Add to your Google Photos library

**How it will be used:**
This scope allows users to upload new photos directly to their Google Photos library when adding photos to family tree members. When a user uploads a photo from their device, they have the option to also save it to their Google Photos library for backup and safekeeping.

**Why it's necessary:**
- Provides an optional backup mechanism for family photos
- Helps users preserve important family memories in their Google Photos account
- Gives users peace of mind that their uploaded family photos are backed up
- Append-only access ensures we cannot delete or modify existing photos

**Data usage:**
- Only used when user explicitly chooses to backup uploaded photos
- Photos are uploaded with appropriate metadata (date, description)
- We never access or modify existing photos in the user's library

#### 3. `.../auth/photoslibrary` (Full access)
**User-facing description:** See, upload, and organize items in your Google Photos library

**How it will be used:**
This scope enables users to organize family photos into albums within their Google Photos account. Users can create dedicated albums for different family branches or events, making it easier to manage and share family photo collections.

**Why it's necessary:**
- Allows users to organize family photos into meaningful albums
- Enables better photo management for large family tree projects
- Provides users with organizational tools within their existing Google Photos workflow
- Users can create albums like "Smith Family," "Wedding Photos," etc.

**Data usage:**
- Only creates albums when user explicitly requests organization features
- Album creation is user-initiated and controlled
- We do not access or modify photos outside of user-selected items

#### 4. `.../auth/photoslibrary.sharing`
**User-facing description:** Manage and add to shared albums on your behalf

**How it will be used:**
This scope allows users to share family photo albums with other family members who are collaborating on the family tree. When multiple family members work together on a shared tree, they can contribute photos to shared albums.

**Why it's necessary:**
- Facilitates collaboration among family members working on shared trees
- Enables family members to contribute photos to collective albums
- Supports the collaborative nature of family tree building
- Makes it easy for extended family to share historical photos

**Data usage:**
- Only used for albums explicitly created for family tree collaboration
- Sharing is user-initiated and controlled
- Users choose which family members to share with

#### 5. `.../auth/photoslibrary.readonly.originals`
**User-facing description:** View your Google Photos library and metadata

**How it will be used:**
This scope allows access to original, uncompressed versions of photos for high-quality display and preservation of family photos. When users select photos for important family records (birth certificates, historical documents), they can access the original quality version.

**Why it's necessary:**
- Ensures family photos are displayed at the highest quality
- Important for preserving historical family documents and photos
- Allows users to maintain archival-quality family records
- Critical for photos that may be used for official documentation

**Data usage:**
- Only accesses original versions of user-selected photos
- Used to ensure quality preservation of family history
- No bulk downloading or processing of user's photo library

---

## Privacy and Security Commitments

1. **Minimal Data Access**: We only access photos and data that users explicitly select through the Google Picker UI
2. **No Background Access**: We never access user photos in the background or without user interaction
3. **Read-Only by Default**: Most scopes are read-only; we never delete user photos
4. **User Control**: Users can revoke access at any time through their Google Account settings
5. **Secure Storage**: Photo URLs and metadata are stored securely in our database with encryption
6. **No Third-Party Sharing**: We never share user photo data with third parties
7. **Transparent Usage**: Users are clearly informed when and why we access their photos

## Limited Scope Alternative

If full access is not approved, we can operate with just:
- `.../auth/photoslibrary.readonly` - For basic photo selection functionality

This would allow core functionality while we work toward full verification for enhanced features.
