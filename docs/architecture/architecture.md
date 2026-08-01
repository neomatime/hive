# HIVE Architecture

## Overview

HIVE follows a feature-driven architecture built on Next.js and Supabase.

```
Browser
    │
Next.js (App Router)
    │
Features
    │
Services
    │
Supabase
 ├── Authentication
 ├── PostgreSQL
 ├── Storage
 └── Realtime
```

---

## Layers

### Presentation
- Pages
- Layouts
- Reusable Components

### Feature
Owns business workflows.

Examples:
- Projects
- Board
- Tasks
- Calendar
- Files
- Settings

### Services

Responsible for:
- Database access
- Validation
- Mapping
- Error handling

### Data

- PostgreSQL
- Storage buckets
- Authentication

---

## State Management

- Local: React
- Shared UI: Zustand
- Server State: TanStack Query

---

## Security

- Supabase Authentication
- Role-based authorization
- Server-side validation
- Protected routes

---

## Principles

- Components remain presentational.
- Services contain business logic.
- No direct database access from UI.
- Reuse before duplication.
- Simplicity over abstraction.
