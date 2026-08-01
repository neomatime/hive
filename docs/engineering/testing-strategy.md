# HIVE Testing Strategy

## 1. Purpose

This document defines how HIVE is tested across unit, integration, end-to-end, accessibility, security, and performance concerns.

Testing exists to protect the core workflows used by the HIMARK team every day.

---

## 2. Testing Objectives

Tests must provide confidence that users can:

- Sign in securely
- Create and manage projects
- Create, assign, move, and complete tasks
- Use the Kanban board
- Upload and access files
- View deadlines and calendar events
- Receive notifications
- Manage settings according to permissions

---

## 3. Testing Pyramid

```text
        End-to-End
       Integration
      Unit / Component
```

Recommended emphasis:

- Unit and component tests: high volume
- Integration tests: moderate volume
- End-to-end tests: focused on critical journeys

Do not attempt to test every visual detail through end-to-end tests.

---

## 4. Test Tooling

Recommended stack:

```text
Vitest
React Testing Library
Playwright
Axe
MSW or Supabase test utilities
```

Optional:

```text
Storybook
Visual regression tooling
```

---

## 5. Unit Tests

Unit tests cover:

- Utilities
- Validation schemas
- Permission functions
- Data mappers
- Date calculations
- Project-progress calculations
- Task-position calculations
- Notification rules

Examples:

```text
calculateProjectProgress()
canUserEditProject()
isTaskOverdue()
buildStoragePath()
```

Requirements:

- Deterministic
- Fast
- No live network dependency
- Clear failure messages

---

## 6. Component Tests

Component tests cover:

- Variants
- User interactions
- Form validation
- Loading states
- Empty states
- Error states
- Disabled states
- Keyboard navigation

Priority components:

- Button
- FormField
- ProjectCard
- TaskCard
- BoardColumn
- TaskDetailDrawer
- FileUpload
- NotificationPanel
- Settings forms

---

## 7. Integration Tests

Integration tests verify interactions between features, services, and data access.

Priority scenarios:

- Project creation creates default board and columns.
- Project template creates copied columns and tasks.
- Moving a task updates column, position, completion state, and activity log.
- Task assignment creates notification.
- Mentioning a user creates notification.
- Uploading a file creates metadata and storage object.
- Archiving a project updates visibility.
- Role changes alter allowed actions.

Use isolated test data.

---

## 8. End-to-End Tests

Critical end-to-end journeys:

### Authentication

```text
Login
Logout
Password reset
Protected route redirect
```

### Projects

```text
Create project
Open project
Edit project
Archive project
```

### Board

```text
Create task
Move task between columns
Open task detail
Assign task
Mark task complete
```

### My Tasks

```text
View assigned tasks
Filter tasks
Open task
Complete task
```

### Calendar

```text
Create event
View event
Edit event
Delete event
```

### Files

```text
Upload file
Open file details
Download file
Delete file
```

### Settings

```text
Update profile
Invite team member
Change role
Update notification preference
Create project template
```

---

## 9. Role and Permission Tests

Test each role explicitly.

### Workspace Owner

- Full workspace access
- Team and role management
- Workspace settings

### Admin

- Operational administration
- No owner-only actions where restricted

### Member / Contributor

- Update authorised project work
- No workspace administration

### Viewer

- Read-only access
- No mutations

Permission tests must validate the server response, not only the UI.

---

## 10. Accessibility Tests

Automated checks:

- Axe violations
- Accessible names
- Form labels
- Dialog semantics
- Colour-independent status communication

Manual checks:

- Keyboard-only use
- Focus order
- Focus trapping
- Screen-reader task movement announcement
- Zoom at 200%
- Reduced-motion behaviour

Target:

```text
WCAG 2.1 AA
```

---

## 11. Visual Regression

Recommended screens:

- Application shell
- Overview
- Projects
- Board
- My Tasks
- Calendar
- Files
- Settings
- Task detail drawer
- Create project dialog

Visual tests should catch accidental layout drift, not replace functional tests.

---

## 12. Database Testing

Test:

- Constraints
- Unique indexes
- Foreign keys
- Cascade behaviour
- Soft deletion
- RLS policies
- Workspace isolation
- Cross-project validation

Database migrations must be tested in a disposable environment before production.

---

## 13. File Testing

Test:

- Supported types
- Unsupported types
- Maximum size
- Failed uploads
- Retry behaviour
- Permission restrictions
- Signed URL expiration
- Deleted-file access

---

## 14. Realtime Testing

Where Supabase Realtime is used, verify:

- Task movement updates connected users.
- New comments appear.
- Notifications update.
- Duplicate events are not applied.
- Disconnected clients recover cleanly.

Realtime must not be required for data correctness.

---

## 15. Performance Testing

Test critical views with realistic data volumes.

Baseline dataset:

```text
50 users
100 active projects
10,000 tasks
5,000 files
20,000 notifications
```

Critical measurements:

- Overview load
- Board load
- Task drag response
- Search
- File list
- Notification panel

---

## 16. Test Data

Use factories or fixtures.

Examples:

```text
createTestWorkspace()
createTestUser()
createTestProject()
createTestTask()
createTestFile()
```

Rules:

- Do not depend on production data.
- Tests must clean up after themselves.
- IDs should be generated dynamically.
- Dates should be controlled.

---

## 17. CI Test Pipeline

Every pull request should run:

```text
Lint
Type check
Unit tests
Component tests
Build
```

Protected branches should also run:

```text
Integration tests
Critical Playwright tests
Migration validation
```

Full regression may run on release or nightly.

---

## 18. Defect Severity

### Critical

- Authentication bypass
- Data loss
- Cross-workspace access
- Production unavailable

### High

- Core project or task workflow broken
- File access broken
- Role permissions incorrect

### Medium

- Non-critical feature malfunction
- Workaround exists

### Low

- Cosmetic issue
- Minor copy or spacing defect

Critical and high defects block release.

---

## 19. Coverage Guidance

Coverage is a signal, not a target by itself.

Recommended minimums:

```text
Services and utilities: 80%
Permission and validation logic: 90%
UI components: risk-based
End-to-end: critical flows only
```

Do not write meaningless tests solely to increase coverage.

---

## 20. Release Test Checklist

Before release:

- Critical journeys pass
- Permission tests pass
- RLS tests pass
- No critical accessibility violations
- No critical or high defects open
- Migrations validated
- File upload and download verified
- Browser smoke tests completed
- Production configuration reviewed

---

## 21. Source of Truth

This document defines HIVE's testing approach.

Every new feature must include an explicit test plan and satisfy the Definition of Done.
