# DomOS v1.1 — Personal Performance OS

DomOS is a GitHub Pages + Supabase-ready personal dashboard for:

- Project Phoenix / gym session-level tracking
- Nutrition OS
- Football training
- Physio / rehab
- Face & body care
- Hair care
- Hairstyling
- Products and reorders
- Universal logs
- Weekly check-ins
- JSON/CSV export

## Important design decision

Project Phoenix does **not** log individual gym sets. DomOS tracks only session completion, readiness, soreness, injury flags, modification notes and weekly adherence. Detailed set logging remains in your separate gym app.

## Setup

### 1. Create a Supabase project

Go to Supabase and create a new project.

### 2. Run the schema

Open Supabase SQL Editor and run:

```sql
sql/schema.sql
```

This creates:

- profiles
- modules
- entries
- routines
- routine_completions
- products
- module_versions
- settings
- Row Level Security policies

### 3. Configure the frontend

Open:

```text
assets/supabase-config.js
```

Paste your Supabase Project URL and anon public key:

```js
window.DOMOS_SUPABASE = {
  url: "https://YOUR_PROJECT.supabase.co",
  anonKey: "YOUR_ANON_PUBLIC_KEY"
};
```

### 4. Upload to GitHub

Create a GitHub repository, upload all files, then enable GitHub Pages.

Recommended GitHub Pages settings:

```text
Source: Deploy from a branch
Branch: main
Folder: /root
```

### 5. Open DomOS

Open the GitHub Pages URL. Go to Settings and create/sign into an account.

If Supabase is not configured yet, DomOS runs in local fallback mode using localStorage.

## File structure

```text
index.html
assets/
  styles.css
  domos-data.js
  app.js
  supabase-config.js
sql/
  schema.sql
README.md
```

## Backup

Use the Data page to export:

- all data as JSON
- entries as CSV

## Notes

This is v1.1 foundation code. It is intentionally built as a static web app so it can run from GitHub Pages and progressively sync with Supabase once configured.
