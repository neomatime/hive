# HIVE API Specification

## 1. Status

```text
Status: Provisional
Version: 0.1
```

This document defines the intended application API surface for HIVE.

Because HIVE uses Next.js and Supabase, implementation may use:

- Server Actions
- Route Handlers
- Supabase database functions
- Supabase Storage APIs
- Supabase Realtime

The contracts below remain valid even when they are not exposed as public REST endpoints.

---

## 2. API Principles

- Internal application API only
- Authentication required
- Server-side authorisation required
- JSON for structured requests and responses
- Stable error format
- Minimal response payloads
- Version contracts before breaking changes

---

## 3. Base Path

For HTTP route handlers:

```text
/api/v1
```

Example:

```text
/api/v1/projects
```

Server Actions may implement the same contracts without public HTTP exposure.

---

## 4. Authentication

Requests require an active Supabase session.

Unauthenticated response:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Sign in to continue."
  }
}
```

---

## 5. Standard Response Format

### Success

```json
{
  "success": true,
  "data": {}
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The submitted information is invalid.",
    "fields": {
      "name": "Project name is required."
    }
  }
}
```

---

## 6. Error Codes

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

---

## 7. Pagination

Request:

```text
?page=1&limit=25
```

Response metadata:

```json
{
  "page": 1,
  "limit": 25,
  "total": 100,
  "totalPages": 4
}
```

Cursor pagination may be used for activity and notifications.

---

## 8. Projects

### List Projects

```http
GET /api/v1/projects
```

Filters:

```text
status
ownerId
favourite
search
page
limit
sort
direction
```

### Create Project

```http
POST /api/v1/projects
```

Request:

```json
{
  "name": "Website Redesign",
  "description": "Redesign the HIMARK website.",
  "ownerId": "uuid",
  "status": "not_started",
  "priority": "medium",
  "startDate": "2026-08-01",
  "dueDate": "2026-09-30",
  "templateId": "uuid"
}
```

### Get Project

```http
GET /api/v1/projects/{projectId}
```

### Update Project

```http
PATCH /api/v1/projects/{projectId}
```

### Archive Project

```http
POST /api/v1/projects/{projectId}/archive
```

### Restore Project

```http
POST /api/v1/projects/{projectId}/restore
```

---

## 9. Project Members

### List Members

```http
GET /api/v1/projects/{projectId}/members
```

### Add Member

```http
POST /api/v1/projects/{projectId}/members
```

Request:

```json
{
  "userId": "uuid",
  "role": "contributor"
}
```

### Update Role

```http
PATCH /api/v1/projects/{projectId}/members/{userId}
```

### Remove Member

```http
DELETE /api/v1/projects/{projectId}/members/{userId}
```

---

## 10. Board

### Get Project Board

```http
GET /api/v1/projects/{projectId}/board
```

Response includes:

```text
Board
Columns
Tasks
Labels
Project members
```

### Update Column Order

```http
PATCH /api/v1/boards/{boardId}/columns/order
```

### Create Column

```http
POST /api/v1/boards/{boardId}/columns
```

### Update Column

```http
PATCH /api/v1/columns/{columnId}
```

### Delete Column

```http
DELETE /api/v1/columns/{columnId}
```

Deletion is rejected while tasks remain in the column.

---

## 11. Tasks

### List Tasks

```http
GET /api/v1/tasks
```

Filters:

```text
projectId
columnId
assigneeId
priority
labelId
due
search
page
limit
```

### Create Task

```http
POST /api/v1/tasks
```

Request:

```json
{
  "projectId": "uuid",
  "columnId": "uuid",
  "title": "Build homepage",
  "description": "",
  "assigneeId": "uuid",
  "priority": "high",
  "dueDate": "2026-08-14",
  "labelIds": ["uuid"]
}
```

### Get Task

```http
GET /api/v1/tasks/{taskId}
```

### Update Task

```http
PATCH /api/v1/tasks/{taskId}
```

### Move Task

```http
POST /api/v1/tasks/{taskId}/move
```

Request:

```json
{
  "targetColumnId": "uuid",
  "position": 2048.5
}
```

### Complete Task

```http
POST /api/v1/tasks/{taskId}/complete
```

### Reopen Task

```http
POST /api/v1/tasks/{taskId}/reopen
```

### Delete Task

```http
DELETE /api/v1/tasks/{taskId}
```

---

## 12. Comments

### List Comments

```http
GET /api/v1/tasks/{taskId}/comments
```

### Add Comment

```http
POST /api/v1/tasks/{taskId}/comments
```

Request:

```json
{
  "content": "Please review the latest version.",
  "mentionedUserIds": ["uuid"]
}
```

### Update Comment

```http
PATCH /api/v1/comments/{commentId}
```

### Delete Comment

```http
DELETE /api/v1/comments/{commentId}
```

---

## 13. Labels

### List Workspace Labels

```http
GET /api/v1/labels
```

### Create Label

```http
POST /api/v1/labels
```

### Attach Label to Task

```http
POST /api/v1/tasks/{taskId}/labels/{labelId}
```

### Remove Label from Task

```http
DELETE /api/v1/tasks/{taskId}/labels/{labelId}
```

---

## 14. Files

### Request Upload

```http
POST /api/v1/files/upload
```

Request:

```json
{
  "projectId": "uuid",
  "taskId": "uuid",
  "folderId": "uuid",
  "name": "requirements.pdf",
  "mimeType": "application/pdf",
  "sizeBytes": 145000
}
```

Response:

```json
{
  "success": true,
  "data": {
    "fileId": "uuid",
    "uploadUrl": "signed-url",
    "storageKey": "private-key"
  }
}
```

### Confirm Upload

```http
POST /api/v1/files/{fileId}/confirm
```

### List Files

```http
GET /api/v1/files
```

Filters:

```text
projectId
folderId
taskId
type
search
page
limit
```

### Get Download URL

```http
POST /api/v1/files/{fileId}/download-url
```

### Rename File

```http
PATCH /api/v1/files/{fileId}
```

### Delete File

```http
DELETE /api/v1/files/{fileId}
```

---

## 15. Folders

### Create Folder

```http
POST /api/v1/folders
```

### Update Folder

```http
PATCH /api/v1/folders/{folderId}
```

### Delete Folder

```http
DELETE /api/v1/folders/{folderId}
```

---

## 16. Calendar

### List Events

```http
GET /api/v1/calendar/events
```

Filters:

```text
start
end
projectId
type
```

### Create Event

```http
POST /api/v1/calendar/events
```

### Get Event

```http
GET /api/v1/calendar/events/{eventId}
```

### Update Event

```http
PATCH /api/v1/calendar/events/{eventId}
```

### Delete Event

```http
DELETE /api/v1/calendar/events/{eventId}
```

---

## 17. Notifications

### List Notifications

```http
GET /api/v1/notifications
```

Filters:

```text
read
type
cursor
limit
```

### Mark Read

```http
POST /api/v1/notifications/{notificationId}/read
```

### Mark All Read

```http
POST /api/v1/notifications/read-all
```

---

## 18. Workspace and Team

### Get Workspace

```http
GET /api/v1/workspace
```

### Update Workspace

```http
PATCH /api/v1/workspace
```

### List Members

```http
GET /api/v1/workspace/members
```

### Invite Member

```http
POST /api/v1/workspace/members/invite
```

### Update Member Role

```http
PATCH /api/v1/workspace/members/{userId}
```

### Remove Member

```http
DELETE /api/v1/workspace/members/{userId}
```

---

## 19. Preferences

### Get User Preferences

```http
GET /api/v1/preferences
```

### Update User Preferences

```http
PATCH /api/v1/preferences
```

### Get Notification Preferences

```http
GET /api/v1/preferences/notifications
```

### Update Notification Preferences

```http
PATCH /api/v1/preferences/notifications
```

---

## 20. Project Templates

### List Templates

```http
GET /api/v1/templates
```

### Create Template

```http
POST /api/v1/templates
```

### Get Template

```http
GET /api/v1/templates/{templateId}
```

### Update Template

```http
PATCH /api/v1/templates/{templateId}
```

### Duplicate Template

```http
POST /api/v1/templates/{templateId}/duplicate
```

### Archive Template

```http
POST /api/v1/templates/{templateId}/archive
```

### Create Project from Template

```http
POST /api/v1/templates/{templateId}/instantiate
```

---

## 21. Search

### Global Search

```http
GET /api/v1/search?q={query}
```

Response groups:

```text
projects
tasks
files
users
```

Result limits should be applied per group.

---

## 22. Activity

### Workspace Activity

```http
GET /api/v1/activity
```

### Project Activity

```http
GET /api/v1/projects/{projectId}/activity
```

Use cursor pagination.

---

## 23. Realtime Events

Potential channels:

```text
workspace:{workspaceId}
project:{projectId}
user:{userId}
```

Events:

```text
task.created
task.updated
task.moved
task.deleted
comment.created
notification.created
file.created
```

Payloads must contain minimal data and stable identifiers.

---

## 24. Idempotency

Use idempotency protection for operations prone to accidental duplication:

- Project creation
- File upload confirmation
- Template instantiation
- Invitation sending

---

## 25. Rate Limiting

HIVE is internal, but basic limits should protect expensive operations:

- Search
- File upload requests
- Invitation sending
- Password reset
- Export operations

---

## 26. API Documentation Rules

When implementation begins:

- Replace provisional routes with actual contracts.
- Add request and response schemas.
- Add permission requirements.
- Add validation rules.
- Add examples.
- Add migration notes for breaking changes.

---

## 27. Source of Truth

This API specification is provisional until implementation stabilises.

Once routes or server actions are implemented, this file must be updated to reflect the actual contract.
