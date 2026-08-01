# HIVE Database Schema

## 1. Purpose

This document defines the database structure for **HIVE**, HIMARK's internal project management application.

HIVE is intentionally focused. The schema supports:

- Users and workspace membership
- Projects and project members
- Kanban boards and task statuses
- Tasks, subtasks, comments, labels, and attachments
- Calendar events and deadlines
- Project files and folders
- Notifications
- Project templates
- User and workspace preferences
- Activity tracking

HIVE does not include billing, subscriptions, CRM, sales, or client financial data.

---

## 2. Recommended Database

**PostgreSQL** is recommended.

Suggested implementation options:

- Supabase PostgreSQL
- Neon PostgreSQL
- Managed PostgreSQL on Azure or AWS

Recommended conventions:

- Primary keys use `uuid`
- Timestamps use `timestamptz`
- Soft deletion is used where recovery may be required
- Foreign keys are indexed
- Business-critical updates are recorded in `activity_logs`

---

## 3. Core Enumerations

### `workspace_role`

```sql
owner
admin
member
viewer
```

### `project_status`

```sql
not_started
active
on_hold
completed
archived
```

### `task_status_type`

```sql
backlog
todo
in_progress
review
done
```

### `task_priority`

```sql
low
medium
high
urgent
```

### `project_member_role`

```sql
project_owner
project_manager
contributor
viewer
```

### `event_type`

```sql
meeting
deadline
milestone
reminder
personal
```

### `notification_type`

```sql
task_assigned
task_due
task_overdue
task_completed
comment_added
mention
project_updated
file_uploaded
calendar_reminder
system
```

### `file_type`

```sql
folder
document
image
spreadsheet
presentation
pdf
archive
other
```

---

## 4. Tables

## 4.1 `users`

Stores the authenticated HIVE user profile.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | uuid | PK | User identifier |
| `auth_user_id` | uuid | UNIQUE, NOT NULL | Authentication provider user ID |
| `first_name` | varchar(100) | NOT NULL | First name |
| `last_name` | varchar(100) | NOT NULL | Last name |
| `display_name` | varchar(200) | NOT NULL | Display name |
| `email` | varchar(255) | UNIQUE, NOT NULL | Work email |
| `phone_number` | varchar(30) | NULL | Phone number |
| `job_title` | varchar(150) | NULL | Role or position |
| `department` | varchar(150) | NULL | HIMARK department |
| `avatar_url` | text | NULL | Profile image URL |
| `timezone` | varchar(100) | NOT NULL | User timezone |
| `locale` | varchar(20) | NOT NULL | Language and locale |
| `is_active` | boolean | NOT NULL, DEFAULT true | Account state |
| `last_seen_at` | timestamptz | NULL | Last application activity |
| `created_at` | timestamptz | NOT NULL | Creation timestamp |
| `updated_at` | timestamptz | NOT NULL | Last update timestamp |
| `deleted_at` | timestamptz | NULL | Soft deletion timestamp |

Indexes:

```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);
```

---

## 4.2 `workspaces`

Stores the HIMARK workspace.

Although HIVE currently has one workspace, this table prevents hard-coding workspace ownership throughout the application.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | uuid | PK | Workspace identifier |
| `name` | varchar(200) | NOT NULL | Workspace name |
| `slug` | varchar(100) | UNIQUE, NOT NULL | URL-safe identifier |
| `description` | text | NULL | Workspace description |
| `logo_url` | text | NULL | Workspace logo |
| `timezone` | varchar(100) | NOT NULL | Workspace timezone |
| `date_format` | varchar(30) | NOT NULL | Default date format |
| `time_format` | varchar(20) | NOT NULL | Default time format |
| `created_by` | uuid | FK → users.id | Creator |
| `created_at` | timestamptz | NOT NULL | Creation timestamp |
| `updated_at` | timestamptz | NOT NULL | Last update timestamp |
| `deleted_at` | timestamptz | NULL | Soft deletion timestamp |

---

## 4.3 `workspace_members`

Connects users to the HIMARK workspace.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | uuid | PK | Membership identifier |
| `workspace_id` | uuid | FK → workspaces.id, NOT NULL | Workspace |
| `user_id` | uuid | FK → users.id, NOT NULL | User |
| `role` | workspace_role | NOT NULL | Workspace role |
| `joined_at` | timestamptz | NOT NULL | Join timestamp |
| `invited_by` | uuid | FK → users.id | Inviting user |
| `is_active` | boolean | NOT NULL, DEFAULT true | Membership status |
| `created_at` | timestamptz | NOT NULL | Creation timestamp |
| `updated_at` | timestamptz | NOT NULL | Last update timestamp |

Constraints:

```sql
UNIQUE (workspace_id, user_id)
```

---

## 4.4 `projects`

Stores HIMARK projects.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | uuid | PK | Project identifier |
| `workspace_id` | uuid | FK → workspaces.id, NOT NULL | Workspace |
| `template_id` | uuid | FK → project_templates.id | Source template |
| `name` | varchar(255) | NOT NULL | Project name |
| `project_code` | varchar(50) | UNIQUE, NOT NULL | Internal project code |
| `description` | text | NULL | Project description |
| `status` | project_status | NOT NULL | Project status |
| `priority` | task_priority | NOT NULL, DEFAULT medium | Project priority |
| `owner_id` | uuid | FK → users.id, NOT NULL | Project owner |
| `start_date` | date | NULL | Planned start |
| `due_date` | date | NULL | Planned completion |
| `completed_at` | timestamptz | NULL | Completion timestamp |
| `progress_percentage` | numeric(5,2) | NOT NULL, DEFAULT 0 | Cached project progress |
| `is_favourite` | boolean | NOT NULL, DEFAULT false | Workspace favourite |
| `created_by` | uuid | FK → users.id, NOT NULL | Creator |
| `created_at` | timestamptz | NOT NULL | Creation timestamp |
| `updated_at` | timestamptz | NOT NULL | Last update timestamp |
| `archived_at` | timestamptz | NULL | Archive timestamp |
| `deleted_at` | timestamptz | NULL | Soft deletion timestamp |

Indexes:

```sql
CREATE INDEX idx_projects_workspace ON projects(workspace_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_due_date ON projects(due_date);
```

---

## 4.5 `project_members`

Stores project-specific access and responsibilities.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | uuid | PK | Membership identifier |
| `project_id` | uuid | FK → projects.id, NOT NULL | Project |
| `user_id` | uuid | FK → users.id, NOT NULL | Team member |
| `role` | project_member_role | NOT NULL | Project role |
| `added_by` | uuid | FK → users.id, NOT NULL | User who added member |
| `joined_at` | timestamptz | NOT NULL | Join timestamp |
| `created_at` | timestamptz | NOT NULL | Creation timestamp |
| `updated_at` | timestamptz | NOT NULL | Last update timestamp |

Constraints:

```sql
UNIQUE (project_id, user_id)
```

---

## 4.6 `boards`

Stores a board for each project.

A project should normally have one active board.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | uuid | PK | Board identifier |
| `project_id` | uuid | FK → projects.id, NOT NULL | Parent project |
| `name` | varchar(150) | NOT NULL | Board name |
| `description` | text | NULL | Board description |
| `is_default` | boolean | NOT NULL, DEFAULT true | Default board |
| `created_by` | uuid | FK → users.id, NOT NULL | Creator |
| `created_at` | timestamptz | NOT NULL | Creation timestamp |
| `updated_at` | timestamptz | NOT NULL | Last update timestamp |

---

## 4.7 `board_columns`

Stores configurable Kanban columns.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | uuid | PK | Column identifier |
| `board_id` | uuid | FK → boards.id, NOT NULL | Parent board |
| `name` | varchar(100) | NOT NULL | Column label |
| `status_type` | task_status_type | NOT NULL | System status |
| `position` | integer | NOT NULL | Horizontal order |
| `wip_limit` | integer | NULL | Optional work-in-progress limit |
| `is_terminal` | boolean | NOT NULL, DEFAULT false | Marks completed state |
| `created_at` | timestamptz | NOT NULL | Creation timestamp |
| `updated_at` | timestamptz | NOT NULL | Last update timestamp |

Constraints:

```sql
UNIQUE (board_id, position)
```

---

## 4.8 `tasks`

Stores all project tasks.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | uuid | PK | Task identifier |
| `project_id` | uuid | FK → projects.id, NOT NULL | Parent project |
| `board_id` | uuid | FK → boards.id, NOT NULL | Parent board |
| `column_id` | uuid | FK → board_columns.id, NOT NULL | Current Kanban column |
| `parent_task_id` | uuid | FK → tasks.id | Parent task for subtasks |
| `title` | varchar(300) | NOT NULL | Task title |
| `description` | text | NULL | Task details |
| `priority` | task_priority | NOT NULL, DEFAULT medium | Priority |
| `assignee_id` | uuid | FK → users.id | Primary assignee |
| `created_by` | uuid | FK → users.id, NOT NULL | Creator |
| `start_date` | date | NULL | Planned start |
| `due_date` | date | NULL | Due date |
| `completed_at` | timestamptz | NULL | Completion timestamp |
| `position` | numeric(20,10) | NOT NULL | Sort order within column |
| `estimated_minutes` | integer | NULL | Estimated effort |
| `progress_percentage` | numeric(5,2) | NOT NULL, DEFAULT 0 | Task progress |
| `is_blocked` | boolean | NOT NULL, DEFAULT false | Blocked state |
| `blocked_reason` | text | NULL | Reason for blockage |
| `created_at` | timestamptz | NOT NULL | Creation timestamp |
| `updated_at` | timestamptz | NOT NULL | Last update timestamp |
| `deleted_at` | timestamptz | NULL | Soft deletion timestamp |

Indexes:

```sql
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_column ON tasks(column_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX idx_tasks_project_column_position
ON tasks(project_id, column_id, position);
```

Validation:

- `parent_task_id` must reference a task within the same project.
- Completed tasks should have `completed_at`.
- Tasks in terminal columns should normally have `progress_percentage = 100`.

---

## 4.9 `task_assignees`

Supports multiple assignees where required.

The main `tasks.assignee_id` remains the responsible owner. This table stores collaborators.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | uuid | PK | Assignment identifier |
| `task_id` | uuid | FK → tasks.id, NOT NULL | Task |
| `user_id` | uuid | FK → users.id, NOT NULL | Assigned user |
| `assigned_by` | uuid | FK → users.id, NOT NULL | Assigner |
| `assigned_at` | timestamptz | NOT NULL | Assignment timestamp |

Constraints:

```sql
UNIQUE (task_id, user_id)
```

---

## 4.10 `labels`

Stores reusable workspace labels.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | uuid | PK | Label identifier |
| `workspace_id` | uuid | FK → workspaces.id, NOT NULL | Workspace |
| `name` | varchar(100) | NOT NULL | Label name |
| `color_token` | varchar(50) | NOT NULL | Design-system colour token |
| `created_by` | uuid | FK → users.id, NOT NULL | Creator |
| `created_at` | timestamptz | NOT NULL | Creation timestamp |
| `updated_at` | timestamptz | NOT NULL | Last update timestamp |

Constraints:

```sql
UNIQUE (workspace_id, name)
```

---

## 4.11 `task_labels`

Connects labels to tasks.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `task_id` | uuid | FK → tasks.id, NOT NULL | Task |
| `label_id` | uuid | FK → labels.id, NOT NULL | Label |
| `created_at` | timestamptz | NOT NULL | Creation timestamp |

Primary key:

```sql
PRIMARY KEY (task_id, label_id)
```

---

## 4.12 `task_comments`

Stores task discussions and mentions.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | uuid | PK | Comment identifier |
| `task_id` | uuid | FK → tasks.id, NOT NULL | Task |
| `author_id` | uuid | FK → users.id, NOT NULL | Comment author |
| `parent_comment_id` | uuid | FK → task_comments.id | Reply parent |
| `content` | text | NOT NULL | Comment content |
| `is_edited` | boolean | NOT NULL, DEFAULT false | Edit state |
| `created_at` | timestamptz | NOT NULL | Creation timestamp |
| `updated_at` | timestamptz | NOT NULL | Last update timestamp |
| `deleted_at` | timestamptz | NULL | Soft deletion timestamp |

---

## 4.13 `comment_mentions`

Stores explicit user mentions.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `comment_id` | uuid | FK → task_comments.id, NOT NULL | Comment |
| `mentioned_user_id` | uuid | FK → users.id, NOT NULL | Mentioned user |
| `created_at` | timestamptz | NOT NULL | Creation timestamp |

Primary key:

```sql
PRIMARY KEY (comment_id, mentioned_user_id)
```

---

## 4.14 `project_folders`

Stores project-level file folders.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | uuid | PK | Folder identifier |
| `project_id` | uuid | FK → projects.id, NOT NULL | Parent project |
| `parent_folder_id` | uuid | FK → project_folders.id | Parent folder |
| `name` | varchar(255) | NOT NULL | Folder name |
| `created_by` | uuid | FK → users.id, NOT NULL | Creator |
| `created_at` | timestamptz | NOT NULL | Creation timestamp |
| `updated_at` | timestamptz | NOT NULL | Last update timestamp |
| `deleted_at` | timestamptz | NULL | Soft deletion timestamp |

---

## 4.15 `files`

Stores uploaded file metadata.

The file binary should be stored in object storage, not directly in PostgreSQL.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | uuid | PK | File identifier |
| `workspace_id` | uuid | FK → workspaces.id, NOT NULL | Workspace |
| `project_id` | uuid | FK → projects.id | Project |
| `folder_id` | uuid | FK → project_folders.id | Folder |
| `task_id` | uuid | FK → tasks.id | Linked task |
| `uploaded_by` | uuid | FK → users.id, NOT NULL | Uploader |
| `name` | varchar(255) | NOT NULL | File name |
| `storage_key` | text | UNIQUE, NOT NULL | Object-storage key |
| `mime_type` | varchar(150) | NOT NULL | MIME type |
| `file_type` | file_type | NOT NULL | HIVE file category |
| `size_bytes` | bigint | NOT NULL | File size |
| `version_number` | integer | NOT NULL, DEFAULT 1 | File version |
| `checksum` | varchar(128) | NULL | Integrity checksum |
| `created_at` | timestamptz | NOT NULL | Upload timestamp |
| `updated_at` | timestamptz | NOT NULL | Last update timestamp |
| `deleted_at` | timestamptz | NULL | Soft deletion timestamp |

Indexes:

```sql
CREATE INDEX idx_files_project ON files(project_id);
CREATE INDEX idx_files_folder ON files(folder_id);
CREATE INDEX idx_files_task ON files(task_id);
```

---

## 4.16 `calendar_events`

Stores meetings, milestones, reminders, and project deadlines.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | uuid | PK | Event identifier |
| `workspace_id` | uuid | FK → workspaces.id, NOT NULL | Workspace |
| `project_id` | uuid | FK → projects.id | Related project |
| `task_id` | uuid | FK → tasks.id | Related task |
| `title` | varchar(255) | NOT NULL | Event title |
| `description` | text | NULL | Event details |
| `event_type` | event_type | NOT NULL | Event type |
| `start_at` | timestamptz | NOT NULL | Start timestamp |
| `end_at` | timestamptz | NULL | End timestamp |
| `is_all_day` | boolean | NOT NULL, DEFAULT false | All-day event |
| `location` | text | NULL | Location or virtual link |
| `created_by` | uuid | FK → users.id, NOT NULL | Creator |
| `created_at` | timestamptz | NOT NULL | Creation timestamp |
| `updated_at` | timestamptz | NOT NULL | Last update timestamp |
| `deleted_at` | timestamptz | NULL | Soft deletion timestamp |

Indexes:

```sql
CREATE INDEX idx_calendar_events_start ON calendar_events(start_at);
CREATE INDEX idx_calendar_events_project ON calendar_events(project_id);
```

---

## 4.17 `calendar_event_attendees`

Stores event participants.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `event_id` | uuid | FK → calendar_events.id, NOT NULL | Event |
| `user_id` | uuid | FK → users.id, NOT NULL | Attendee |
| `response_status` | varchar(20) | NOT NULL, DEFAULT pending | RSVP state |
| `created_at` | timestamptz | NOT NULL | Creation timestamp |

Primary key:

```sql
PRIMARY KEY (event_id, user_id)
```

---

## 4.18 `notifications`

Stores actionable user notifications.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | uuid | PK | Notification identifier |
| `user_id` | uuid | FK → users.id, NOT NULL | Recipient |
| `workspace_id` | uuid | FK → workspaces.id, NOT NULL | Workspace |
| `type` | notification_type | NOT NULL | Notification type |
| `title` | varchar(255) | NOT NULL | Notification title |
| `message` | text | NOT NULL | Notification message |
| `entity_type` | varchar(50) | NULL | Related entity type |
| `entity_id` | uuid | NULL | Related entity ID |
| `is_read` | boolean | NOT NULL, DEFAULT false | Read state |
| `read_at` | timestamptz | NULL | Read timestamp |
| `created_at` | timestamptz | NOT NULL | Creation timestamp |

Indexes:

```sql
CREATE INDEX idx_notifications_user_read
ON notifications(user_id, is_read, created_at DESC);
```

---

## 4.19 `user_preferences`

Stores user-specific settings.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | uuid | PK | Preference identifier |
| `user_id` | uuid | FK → users.id, UNIQUE, NOT NULL | User |
| `theme` | varchar(20) | NOT NULL, DEFAULT light | Light, dark, system |
| `default_project_view` | varchar(20) | NOT NULL, DEFAULT board | Default project view |
| `default_task_priority` | task_priority | NOT NULL, DEFAULT medium | Default task priority |
| `default_task_status` | task_status_type | NOT NULL, DEFAULT todo | Default task status |
| `tasks_per_page` | integer | NOT NULL, DEFAULT 25 | List pagination size |
| `show_completed_tasks` | boolean | NOT NULL, DEFAULT false | Completed task visibility |
| `compact_mode` | boolean | NOT NULL, DEFAULT false | Compact display |
| `week_starts_on` | smallint | NOT NULL, DEFAULT 1 | 1 = Monday |
| `working_hours_start` | time | NULL | Workday start |
| `working_hours_end` | time | NULL | Workday end |
| `created_at` | timestamptz | NOT NULL | Creation timestamp |
| `updated_at` | timestamptz | NOT NULL | Last update timestamp |

---

## 4.20 `notification_preferences`

Stores notification channel preferences.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | uuid | PK | Preference identifier |
| `user_id` | uuid | FK → users.id, NOT NULL | User |
| `notification_type` | notification_type | NOT NULL | Notification category |
| `in_app_enabled` | boolean | NOT NULL, DEFAULT true | In-app notifications |
| `email_enabled` | boolean | NOT NULL, DEFAULT false | Email notifications |
| `browser_enabled` | boolean | NOT NULL, DEFAULT false | Browser push |
| `created_at` | timestamptz | NOT NULL | Creation timestamp |
| `updated_at` | timestamptz | NOT NULL | Last update timestamp |

Constraints:

```sql
UNIQUE (user_id, notification_type)
```

---

## 4.21 `project_templates`

Stores reusable project structures.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | uuid | PK | Template identifier |
| `workspace_id` | uuid | FK → workspaces.id, NOT NULL | Workspace |
| `name` | varchar(255) | NOT NULL | Template name |
| `description` | text | NULL | Template purpose |
| `category` | varchar(100) | NULL | Template category |
| `created_by` | uuid | FK → users.id, NOT NULL | Creator |
| `is_active` | boolean | NOT NULL, DEFAULT true | Template availability |
| `created_at` | timestamptz | NOT NULL | Creation timestamp |
| `updated_at` | timestamptz | NOT NULL | Last update timestamp |
| `archived_at` | timestamptz | NULL | Archive timestamp |

---

## 4.22 `project_template_columns`

Stores board columns included in a template.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | uuid | PK | Template column identifier |
| `template_id` | uuid | FK → project_templates.id, NOT NULL | Template |
| `name` | varchar(100) | NOT NULL | Column name |
| `status_type` | task_status_type | NOT NULL | Column status |
| `position` | integer | NOT NULL | Column order |

---

## 4.23 `project_template_tasks`

Stores default tasks included in a project template.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | uuid | PK | Template task identifier |
| `template_id` | uuid | FK → project_templates.id, NOT NULL | Template |
| `template_column_id` | uuid | FK → project_template_columns.id, NOT NULL | Default column |
| `parent_template_task_id` | uuid | FK → project_template_tasks.id | Parent task |
| `title` | varchar(300) | NOT NULL | Default task title |
| `description` | text | NULL | Default task description |
| `priority` | task_priority | NOT NULL, DEFAULT medium | Default priority |
| `due_offset_days` | integer | NULL | Days from project start |
| `position` | numeric(20,10) | NOT NULL | Sort order |
| `created_at` | timestamptz | NOT NULL | Creation timestamp |
| `updated_at` | timestamptz | NOT NULL | Last update timestamp |

---

## 4.24 `activity_logs`

Stores an audit-friendly activity feed.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | uuid | PK | Activity identifier |
| `workspace_id` | uuid | FK → workspaces.id, NOT NULL | Workspace |
| `project_id` | uuid | FK → projects.id | Project |
| `user_id` | uuid | FK → users.id | Acting user |
| `action` | varchar(100) | NOT NULL | Action code |
| `entity_type` | varchar(50) | NOT NULL | Entity type |
| `entity_id` | uuid | NOT NULL | Entity identifier |
| `metadata` | jsonb | NULL | Contextual details |
| `created_at` | timestamptz | NOT NULL | Activity timestamp |

Indexes:

```sql
CREATE INDEX idx_activity_logs_workspace
ON activity_logs(workspace_id, created_at DESC);

CREATE INDEX idx_activity_logs_project
ON activity_logs(project_id, created_at DESC);
```

---

## 5. Recommended Deletion Behaviour

| Parent | Child | Behaviour |
|---|---|---|
| Workspace | Projects | Restrict or soft delete |
| Project | Board | Cascade |
| Project | Tasks | Soft delete |
| Board | Columns | Cascade |
| Column | Tasks | Restrict until tasks are moved |
| Task | Comments | Cascade or soft delete |
| Task | Files | Set `task_id` to null or soft delete |
| Project | Files | Soft delete |
| User | Created content | Preserve and anonymise if necessary |

Avoid hard deletion for projects, tasks, comments, and files during normal application use.

---

## 6. Derived and Cached Values

The following values may be calculated dynamically or cached for performance:

### Project progress

Recommended formula:

```text
completed active tasks / total active tasks × 100
```

Subtasks may either:

- Count as independent tasks, or
- Roll up into the parent task

Pick one rule and apply it consistently.

### Overdue tasks

```text
due_date < current_date
AND task is not in a terminal board column
```

### My Tasks

```text
tasks.assignee_id = current_user
OR current_user exists in task_assignees
```

### Board counts

Count active tasks by `column_id`.

---

## 7. Row-Level Security Guidance

If Supabase is used, apply row-level security.

Core rules:

- Users can only access records within workspaces where they are active members.
- Workspace owners and admins can manage all workspace records.
- Project members can view assigned projects.
- Project owners and managers can update project configuration.
- Members can update tasks where they are assigned or have project edit access.
- Viewers have read-only access.
- Users can only update their own preferences.
- Users can only read their own notifications.

---

## 8. MVP Table Set

For the first working version, implement:

```text
users
workspaces
workspace_members
projects
project_members
boards
board_columns
tasks
task_comments
labels
task_labels
project_folders
files
calendar_events
calendar_event_attendees
notifications
user_preferences
notification_preferences
project_templates
project_template_columns
project_template_tasks
activity_logs
```

The following can be deferred:

```text
task_assignees
comment_mentions
advanced file versioning
session tracking
connected-device history
external integrations
```

---

## 9. Naming Rules

- Use plural snake_case table names.
- Use singular snake_case column names.
- Use `created_at`, `updated_at`, and `deleted_at` consistently.
- Use `*_id` for foreign keys.
- Use stable machine values for enums.
- Keep user-facing labels separate from internal enum values.
