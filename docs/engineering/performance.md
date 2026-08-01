# HIVE Performance Specification

## 1. Purpose

This document defines performance targets, monitoring, and optimisation rules for HIVE.

HIVE should feel immediate during daily project management work.

---

## 2. Performance Principles

- Optimise real user workflows.
- Measure before optimising.
- Keep initial payloads small.
- Use pagination and incremental loading.
- Prefer optimistic updates for safe interactions.
- Do not sacrifice correctness for perceived speed.

---

## 3. User Experience Targets

| Interaction | Target |
|---|---:|
| Initial authenticated page load | Under 2.5 seconds |
| Route transition | Under 500 ms perceived |
| Board task drag feedback | Under 100 ms |
| Board task persistence | Under 500 ms typical |
| Search response | Under 300 ms typical |
| Task drawer open | Under 300 ms |
| Notification action | Under 500 ms |
| File upload feedback | Immediate |
| Standard mutation confirmation | Under 1 second |

Targets are measured under normal South African business internet conditions.

---

## 4. Core Web Vitals

Production targets:

```text
LCP: under 2.5 seconds
INP: under 200 ms
CLS: under 0.1
```

Monitor at the 75th percentile.

---

## 5. Data Volume Assumptions

Initial planning baseline:

```text
50 workspace users
100 active projects
10,000 active tasks
5,000 files
20,000 notifications
50,000 activity records
```

The application should remain usable beyond these values through pagination and indexing.

---

## 6. Frontend Performance

### Rendering

- Use React Server Components where beneficial.
- Keep interactive client components focused.
- Avoid making entire pages client components.
- Memoise only after identifying actual render problems.
- Virtualise long task or file lists where required.

### Bundles

- Dynamically import heavy components.
- Load calendar and file-preview libraries only when used.
- Avoid large general-purpose libraries for simple utilities.
- Analyse production bundles regularly.

### Images

- Optimise avatars and previews.
- Set explicit dimensions.
- Use lazy loading.
- Use thumbnails instead of full-size files in lists.

---

## 7. Data Fetching

Use TanStack Query or server-side data fetching consistently.

Rules:

- Cache stable data.
- Invalidate narrowly.
- Prefetch likely next views.
- Paginate large lists.
- Avoid duplicate requests.
- Cancel stale searches.
- Debounce search input.

Recommended stale times:

```text
Workspace settings: 5–15 minutes
Project list: 1–5 minutes
Board data: short-lived, realtime-assisted
User preferences: 5–15 minutes
Notifications: short-lived
```

---

## 8. Kanban Performance

The Board is HIVE's most interaction-sensitive view.

Requirements:

- Render only required task metadata.
- Use optimistic drag updates.
- Persist position using fractional ordering.
- Avoid refetching the entire board after every move.
- Roll back failed moves.
- Virtualise columns with very large task counts.
- Keep drag overlays lightweight.

Do not calculate complex project analytics during task movement.

---

## 9. Database Performance

Required indexes include:

- Workspace foreign keys
- Project status and owner
- Task project, column, assignee, due date
- Notification user and read state
- File project and folder
- Calendar start date
- Activity project and created date

Rules:

- Avoid unbounded queries.
- Select only required columns.
- Use database functions for complex atomic mutations where appropriate.
- Review slow queries.
- Use explain plans before adding speculative indexes.

---

## 10. Search Performance

Initial search may use PostgreSQL full-text or indexed partial matching.

Requirements:

- Debounce user input.
- Minimum query length where appropriate.
- Limit results per entity.
- Return grouped results.
- Cancel outdated requests.
- Index searchable fields.

Search must not scan all records on every keystroke.

---

## 11. File Performance

- Upload directly to object storage using authorised flows.
- Show progress immediately.
- Generate thumbnails asynchronously where introduced.
- Avoid loading file contents in list views.
- Use signed URLs only when preview or download begins.
- Stream downloads where supported.

---

## 12. Notification Performance

- Paginate notification history.
- Load unread notifications first.
- Maintain unread counts efficiently.
- Mark-as-read optimistically.
- Avoid refetching full notification history after one update.

---

## 13. Realtime Performance

Use realtime selectively.

Suitable:

- Task movement
- New comments
- Notifications

Avoid broad subscriptions to entire high-volume tables.

Subscriptions must be scoped to:

- Workspace
- Project
- Current user

Realtime events should trigger narrow cache updates.

---

## 14. Server Performance

- Keep server actions small.
- Validate early.
- Avoid repeated membership queries within one request.
- Use transaction boundaries for multi-step mutations.
- Return minimal response payloads.
- Log slow server operations.

---

## 15. Caching Strategy

Cache:

- Workspace metadata
- User profile
- Project directory
- Static configuration
- Project templates

Do not cache incorrectly:

- Permission decisions across users
- Signed storage URLs beyond expiry
- Rapidly changing board state for long periods

Every cached value needs an invalidation rule.

---

## 16. Loading Experience

Use:

- Skeletons matching final layout
- Optimistic updates
- Progressive loading
- Inline upload progress
- Background refresh

Avoid:

- Full-page spinners after authentication
- Blank screens
- Layout shifts
- Blocking unrelated sections

---

## 17. Performance Monitoring

Monitor:

- Web Vitals
- Route load times
- API/server action duration
- Database query duration
- Error rates
- File upload failures
- Realtime connection failures

Recommended tools may include:

```text
Vercel Analytics
Vercel Speed Insights
Supabase logs
Sentry
PostHog
```

Tool selection should remain lightweight for an internal application.

---

## 18. Performance Budgets

Suggested budgets:

```text
Initial JavaScript: under 250 KB compressed where practical
Individual lazy-loaded feature chunk: under 150 KB compressed
Standard API response: under 100 KB
Board initial response: paginated or under 500 KB
```

Large deviations require justification.

---

## 19. Performance Test Scenarios

Test:

- Opening board with 500 tasks
- Moving tasks repeatedly
- Searching 10,000 tasks
- Loading project directory with 100 projects
- Loading 5,000 files through pagination
- Opening notification history
- Multiple concurrent users on one board

---

## 20. Anti-Patterns

Do not:

- Fetch all workspace data at login.
- Refetch the entire page after one mutation.
- Load full file content in lists.
- Subscribe to unscoped realtime tables.
- Add indexes without query evidence.
- Turn every component into a client component.
- Add heavy libraries without bundle review.
- Optimise obscure flows before core workflows.

---

## 21. Source of Truth

This document defines HIVE's performance requirements.

Performance regressions affecting the Board, Projects, My Tasks, Calendar, or Files must block release when they materially disrupt daily work.
