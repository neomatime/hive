# HIVE System Architecture

## 1. Purpose

This document provides the detailed technical architecture for HIVE.

It complements the high-level `architecture.md` and the Technical Design Specification.

---

## 2. System Context

HIVE is an internal web application used by HIMARK employees to manage projects, tasks, files, deadlines, and team activity.

```text
HIMARK User
    │
    ▼
HIVE Web Application
    │
    ├── Supabase Auth
    ├── PostgreSQL
    ├── Supabase Storage
    └── Supabase Realtime
```

---

## 3. Application Stack

```text
Next.js App Router
React
TypeScript
Tailwind CSS
shadcn/ui
TanStack Query
Zustand
Zod
Supabase
PostgreSQL
Vercel
```

---

## 4. Architectural Layers

```text
Presentation
    ↓
Feature
    ↓
Application Services
    ↓
Repositories / Data Access
    ↓
Supabase
```

### Presentation Layer

Contains:

- Pages
- Layouts
- Reusable UI components
- View-specific composition

Responsibilities:

- Render data
- Capture user input
- Trigger feature actions
- Display states

Must not contain database logic.

### Feature Layer

Examples:

```text
projects
tasks
board
calendar
files
notifications
settings
templates
```

Responsibilities:

- Feature hooks
- Feature-specific components
- Feature validation
- Use-case coordination

### Application Services

Examples:

```text
ProjectService
TaskService
BoardService
FileService
CalendarService
NotificationService
```

Responsibilities:

- Business rules
- Permission orchestration
- Transactions
- Error mapping
- Activity generation

### Repository Layer

Examples:

```text
ProjectRepository
TaskRepository
FileRepository
```

Responsibilities:

- Supabase queries
- Persistence
- Database-specific mapping

This layer may be lightweight, but it prevents Supabase queries from spreading throughout the application.

---

## 5. Request Lifecycle

```text
User Action
→ Component
→ Feature Hook / Server Action
→ Validation
→ Authentication
→ Authorisation
→ Service
→ Repository
→ Database / Storage
→ Result Mapping
→ Cache Update
→ UI Feedback
```

Errors must be converted into stable application error types before reaching the UI.

---

## 6. Authentication Lifecycle

```text
Login Form
→ Supabase Auth
→ Session Cookie / Token
→ Middleware Validation
→ Protected Route
→ Server-Side User Resolution
→ Workspace Membership Resolution
```

The application should maintain one canonical server-side method for resolving:

```text
Current user
Current workspace
Current role
```

---

## 7. Authorisation Architecture

Authorisation is enforced in two places:

### Database

Supabase Row-Level Security protects direct data access.

### Application

Services enforce business rules and role permissions.

Example:

```text
Task Move Request
→ User authenticated
→ User belongs to workspace
→ User may edit project
→ Target column belongs to same board
→ Move applied
```

Neither layer replaces the other.

---

## 8. State Management

### Local State

Use React state for:

- Open/closed state
- Form interaction
- Local filters
- Temporary UI state

### Shared UI State

Use Zustand for:

- Sidebar state
- Command palette
- Global drawer state
- Temporary workspace UI preferences

Do not duplicate server data in Zustand.

### Server State

Use TanStack Query for:

- Projects
- Tasks
- Files
- Calendar events
- Notifications
- Templates

Server state remains the source of truth.

---

## 9. Data Fetching Architecture

Use one of two patterns:

### Server-Rendered Initial Data

Suitable for:

- Overview
- Project directory
- Settings
- Initial project page

### Client Query

Suitable for:

- Board interaction
- Search
- Notifications
- Infinite scrolling
- Realtime-assisted views

Avoid mixing patterns without a reason.

---

## 10. Mutation Architecture

Mutations should follow:

```text
Validate input
→ Resolve user
→ Check permission
→ Execute transaction
→ Write activity
→ Create notification if required
→ Return minimal result
→ Update cache
```

Multi-step business operations should be atomic where practical.

Example task move:

1. Validate task and target column.
2. Check edit permission.
3. Update column and position.
4. Set or clear completion timestamp.
5. Write activity log.
6. Return updated task state.

---

## 11. Error Architecture

Use stable error categories:

```text
VALIDATION_ERROR
UNAUTHENTICATED
FORBIDDEN
NOT_FOUND
CONFLICT
STORAGE_ERROR
RATE_LIMITED
INTERNAL_ERROR
```

UI messages should be user-friendly.

Server logs may contain diagnostic context but must exclude secrets.

---

## 12. Board Architecture

```text
Board Page
├── BoardToolbar
├── KanbanBoard
│   ├── BoardColumn[]
│   └── TaskCard[]
└── TaskDetailDrawer
```

Data model:

```text
Project
→ Board
→ Columns
→ Tasks
```

Interaction model:

```text
Drag
→ Optimistic cache update
→ Persist fractional position
→ Confirm
or
→ Rollback and show error
```

---

## 13. Project Creation Flow

```text
Create Project Dialog
→ Validate
→ Create project
→ Create default board
→ Create default columns
→ Add owner as project member
→ Copy template content if selected
→ Write activity log
→ Navigate to project
```

This operation should use a server-side transaction or database function.

---

## 14. Template Instantiation

Templates are copied, not dynamically linked.

```text
Project Template
→ New Project
→ New Board Columns
→ New Tasks
→ Resolve parent-child references
→ Calculate due dates
```

Editing a template must not change existing projects.

---

## 15. File Upload Architecture

```text
User selects file
→ Client validation
→ Request authorised upload
→ Upload to private storage
→ Create file metadata
→ Write activity
→ Update file cache
```

If metadata creation fails after upload, orphaned storage objects should be cleaned up.

---

## 16. Notification Architecture

Notification generation belongs in application services, not UI components.

```text
Business Event
→ Notification Rule
→ Notification Record
→ Realtime Event
→ User Interface
```

Examples:

- Task assigned
- User mentioned
- Review requested
- Task overdue

Scheduled overdue notifications may use cron or Supabase scheduled functions.

---

## 17. Calendar Architecture

Calendar events may be:

- User-created
- Project-created
- Task deadline-derived

Task deadlines and calendar events must have a defined synchronisation rule.

Recommended:

- Task due dates render directly on the calendar.
- Separate event records are used for meetings and milestones.
- Avoid duplicating every task deadline as a second persistent event.

---

## 18. Search Architecture

Global search queries:

```text
Projects
Tasks
Files
Users
```

Initial implementation:

- PostgreSQL indexed search
- Grouped limited results
- Debounced client input

Future implementation may use dedicated full-text search if required.

---

## 19. Realtime Architecture

Use realtime for:

- Task movement
- New comments
- Notifications

Subscriptions must be scoped.

```text
Current workspace
Current project
Current user
```

Realtime updates the query cache. It does not become a separate source of truth.

---

## 20. Background Processing

Potential background jobs:

- Due-date notifications
- File thumbnail creation
- Expired session cleanup
- Orphaned upload cleanup
- Archived-data maintenance

Use Supabase Edge Functions, scheduled functions, or a lightweight job mechanism.

Do not introduce a complex queue until required.

---

## 21. Folder Boundaries

```text
app/
  Routes and composition

components/
  Reusable presentation components

features/
  Feature-specific UI and hooks

services/
  Business operations

repositories/
  Data access

lib/
  Framework and provider configuration

types/
  Shared domain types

utils/
  Pure helpers
```

Dependency direction:

```text
app → features → services → repositories → lib
components → types / utilities
```

Repositories must not depend on presentation layers.

---

## 22. Environment Architecture

```text
Local
Staging
Production
```

Each environment has independent:

- Supabase project
- Database
- Storage
- Secrets
- Authentication users

---

## 23. Observability

Capture:

- Application errors
- Server action failures
- Slow database queries
- Authentication failures
- File upload failures
- Realtime failures

Every log should include a request or correlation identifier where practical.

---

## 24. Scalability Boundaries

HIVE is an internal tool.

Optimise for:

```text
Tens of users
Hundreds of projects
Tens of thousands of tasks
Thousands of files
```

Do not introduce enterprise-scale distributed architecture without evidence.

---

## 25. Architectural Decision Rules

Before adding infrastructure:

1. Confirm the current architecture cannot meet the requirement.
2. Measure the actual constraint.
3. Select the smallest adequate solution.
4. Document the decision.
5. Update this architecture.

---

## 26. Source of Truth

This document defines HIVE's detailed system architecture.

Implementation must preserve the layer boundaries and security model defined here.
