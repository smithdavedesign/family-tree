# Help & Documentation

## Getting Started

### Creating Your First Family Tree

1. **Sign In**
   - Click "Sign in with Google" or use the magic link option
   - Enter your email and check your inbox for the login link

2. **Create a Tree**
   - Click "Create New Tree" on the dashboard
   - Enter a name for your tree (e.g., "Smith Family Tree")
   - Optionally add a description
   - Click "Create"

3. **Add Your First Person**
   - Click "Add Root Person" in the center of the tree
   - Fill in the person's details:
     - First name (required)
     - Last name
     - Date of birth
     - Gender
     - Biography
     - Occupation
     - Place of birth
   - Click "Save"

4. **Add Relationships**
   - Right-click on a person node
   - Select "Add Spouse", "Add Child", or "Add Parent"
   - Fill in the new person's details
   - The relationship will be created automatically

---

## Features Guide

### Tree Visualization

**Navigation:**
- **Pan:** Click and drag the background
- **Zoom:** Use mouse wheel or pinch gesture
- **Center:** Click the "Center" button to reset view
- **Fit:** Click "Fit View" to see entire tree

**Layout Options:**
- **Vertical:** Traditional top-down layout
- **Horizontal:** Left-to-right layout
- Toggle using the layout direction button

**Controls:**
- **View Lock:** Prevent accidental panning/zooming
- **MiniMap:** Navigate large trees easily
- **Search:** Find family members by name or occupation
- **Focus Mode:** Isolate a specific lineage

### Search & Filter

**Search by Name:**
1. Click the search icon (🔍)
2. Type a person's name
3. Matching persons will be highlighted
4. Click on a result to center on that person

**Search by Year:**
- Use the year range filter to find people born/died in specific periods
- Adjust the sliders to set min/max years

**Clear Search:**
- Click the X button to clear search results
- Press Escape key to close search panel

### Timeline View

**Features:**
- Chronological visualization of all life events
- Color-coded events:
  - 🟦 Teal: Birth
  - 🟥 Red: Death
  - 🟪 Purple: Marriage
- Horizontal scrolling timeline
- Decade ruler on the left
- Density heatmap background

**Navigation:**
- Click and drag to pan through time
- Hover over events to see details
- Click events to see full person information

### Person Details

**Editing:**
1. Click on a person node
2. Side panel opens with details
3. Click "Edit" to modify information
4. Click "Save" to confirm changes

**Available Fields:**
- Basic: Name, gender, dates
- Life events: Birth, death, burial
- Details: Occupation, education, biography
- Photos: Upload and manage photos

**Photo Gallery:**
- Upload photos from Google Photos
- Set a primary photo (shows on tree node)
- Add captions and dates
- Delete photos

### Sharing & Collaboration

**Invite Members:**
1. Click "Invite" button
2. Enter email address
3. Select role:
   - **Viewer:** Can view only
   - **Editor:** Can add/edit persons
   - **Owner:** Full control
4. Click "Send Invitation"

**Manage Members:**
- View all tree members
- Change member roles
- Remove members
- Transfer ownership

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + F` | Open search |
| `Escape` | Close panels/dialogs |
| `Ctrl/Cmd + Z` | Undo (coming soon) |
| `Ctrl/Cmd + Y` | Redo (coming soon) |
| `+` / `-` | Zoom in/out |
| `0` | Reset zoom |
| `Space + Drag` | Pan view |

---

## Data Export

### JSON Export
**Use case:** Backup, data analysis, migration

**How to export:**
1. Open your tree
2. Click "Export" → "JSON"
3. File downloads automatically
4. Contains all persons, relationships, and photos

### GEDCOM Export
**Use case:** Import to other genealogy software (Ancestry, MyHeritage, etc.)

**How to export:**
1. Open your tree
2. Click "Export" → "GEDCOM"
3. File downloads as `.ged` format
4. Compatible with GEDCOM 5.5.1 standard

**Supported software:**
- Ancestry.com
- MyHeritage
- FamilySearch
- Legacy Family Tree
- Gramps

---

## Troubleshooting

### Common Issues

**Problem: Can't see my tree**
- Solution: Click "Fit View" to reset the viewport
- Check if you have permission to view the tree

**Problem: Photos not uploading**
- Solution: Ensure you've granted Google Photos permission
- Check file size (max 10MB per photo)
- Verify internet connection

**Problem: Changes not saving**
- Solution: Check your internet connection
- Verify you have editor permissions
- Try refreshing the page

**Problem: Invitation not received**
- Solution: Check spam folder
- Verify email address is correct
- Ask owner to resend invitation

### Performance Tips

**For large trees (100+ persons):**
- Use Focus Mode to view specific branches
- Enable View Lock when not navigating
- Close unused browser tabs
- Use Chrome or Firefox for best performance

**For slow loading:**
- Clear browser cache
- Disable browser extensions
- Check internet speed
- Try incognito/private mode

---

## Privacy & Security

**Your data is:**
- ✅ Encrypted in transit (HTTPS)
- ✅ Stored securely (Supabase)
- ✅ Access-controlled (RBAC)
- ✅ Audit-logged (all actions tracked)

**You control:**
- Who can view your trees
- Who can edit your trees
- What data to export
- When to delete your account

**We never:**
- ❌ Sell your data
- ❌ Share with third parties
- ❌ Use for advertising
- ❌ Access without permission

---

## Support

**Need help?**
- 📧 Email: support@familytreeapp.com
- 💬 GitHub Issues: [Report a bug](https://github.com/smithdavedesign/family-tree/issues)
- 📖 Documentation: [Full docs](https://github.com/smithdavedesign/family-tree)

**Feature requests:**
- Submit via GitHub Issues
- Vote on existing requests
- Contribute code (open source!)

---

## Tips & Best Practices

### Data Entry
1. **Start with yourself** and work backwards
2. **Verify dates** before entering (check records)
3. **Add sources** in biography field
4. **Use consistent naming** (e.g., always "John" not "Johnny")
5. **Include maiden names** in parentheses

### Organization
1. **Create separate trees** for different family lines
2. **Use descriptions** to note research status
3. **Tag locations** consistently (City, State, Country)
4. **Add photos** to make trees more engaging
5. **Export regularly** as backup

### Collaboration
1. **Communicate with editors** about changes
2. **Document sources** for verification
3. **Resolve conflicts** through discussion
4. **Share findings** with family members
5. **Respect privacy** of living persons

---

## Version History

**v1.0** (Current)
- Tree visualization with ReactFlow
- Person and relationship management
- Photo gallery integration
- Timeline view
- Search and filter
- Data export (JSON/GEDCOM)
- Role-based access control
- Mobile-responsive design

**Coming Soon:**
- Undo/Redo functionality
- Advanced search filters
- DNA integration
- Source citations
- Historical records integration
- Mobile app
