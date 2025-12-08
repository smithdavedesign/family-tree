# Demo Tree Seed Script

## Overview
Creates a comprehensive 4-generation demo family tree with **20 people**, full relationship hierarchy, life events, stories, and mock profile photos.

## What's Included

### 👥 20 People Across 4 Generations
- **Generation 1** (Great-Grandparents): James, Mary, Robert, Patricia (born 1918-1922, deceased)
- **Generation 2** (Grandparents): John, Jennifer, Michael, Linda (born 1945-1950)
- **Generation 3** (Parents): William, Elizabeth, David, Barbara, Richard, Susan (born 1970-1977)
- **Generation 4** (Children): Joseph, Jessica, Thomas, Sarah, Charles, Karen (born 1995-2004)

### 📋 Features
- ✅ **Full bios** for every person
- ✅ **Occupations** (engineers, doctors, teachers, students, etc.)
- ✅ **Birth/death dates** and places
- ✅ **Profile photos** (placeholder avatars from pravatar.cc)
- ✅ **40+ relationships** (marriages, parent-child, siblings)
- ✅ **15+ life events** (education, career milestones, military service, achievements, travel)
- ✅ **3 detailed stories** with rich text formatting

### 🌳 Family Structure
```
James Smith ❤️ Mary Johnson
├── John Smith ❤️ Jennifer Williams
│   ├── William Smith ❤️ Elizabeth Davis
│   │   ├── Joseph Smith
│   │   └── Jessica Smith
│   ├── David Smith ❤️ Barbara Wilson
│   │   ├── Thomas Smith
│   │   └── Sarah Smith
│   └── Richard Smith ❤️ Susan Anderson
│       ├── Charles Smith
│       └── Karen Smith
└── Michael Smith ❤️ Linda Brown
    └── Elizabeth Davis (married into other branch)

Robert Williams ❤️ Patricia Brown
├── Jennifer Williams (married John Smith above)
└── Linda Brown (married Michael Smith above)
```

## How to Run

### Option 1: Supabase SQL Editor (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **"New Query"**
4. Copy and paste the entire contents of `demo_tree_seed.sql`
5. Click **"Run"**

### Option 2: psql Command Line
```bash
psql postgresql://your-connection-string < server/sql-prompts/demo_tree_seed.sql
```

## Expected Output
```
NOTICE:  Found user ID: [your-uuid]
NOTICE:  Demo tree created successfully!
NOTICE:  Tree ID: [new-tree-uuid]
NOTICE:  Total persons created: 20
NOTICE:  Total relationships created: 40+
NOTICE:  Total life events created: 15+
NOTICE:  Total stories created: 3
```

## Testing the Features

After running the seed:

1. **Standard Tree View**: See all 20 people with relationships
2. **Fan Chart**: Click any person → View their ancestor fan
3. **Descendant Chart**: Click any Gen 1-3 person → See their descendants
4. **Event Chart**: View timeline with 15+ events across 100 years (1920-2020)
5. **SidePanel**: Click anyone → See full bio, dates, occupation
6. **Stories**: Navigate to stories tab → Read 3 family narratives
7. **Life Events**: Click people with events → See detailed life milestones

## Notes

- Script automatically finds user by email `1426davejobs@gmail.com`
- If email not found, script will fail with clear error message
- Creates exactly **1 new tree** (doesn't modify existing trees)
- All data is self-contained and can be deleted by deleting the tree
- Profile photos use pravatar.cc placeholders (public avatars)

## Cleanup

To remove the demo tree:
```sql
-- Find the demo tree ID
SELECT id, name FROM trees WHERE name = 'Demo Family Tree';

-- Delete it (cascade will remove all related data)
DELETE FROM trees WHERE id = '[tree-id-from-above]';
```
