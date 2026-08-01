# HIVE Components

## 1. Purpose

This document defines the reusable interface components used across **HIVE**, HIMARK's internal project management tool.

It should be read together with:

- `design-system.md`
- `PRD.md`
- `FRS.md`
- `TDS.md`

The goal is to keep the application visually consistent, technically maintainable, and simple to use.

Every reusable component must define:

- Purpose
- Anatomy
- Variants
- States
- Behaviour
- Accessibility
- Usage guidance

---

## 2. Component Principles

### 2.1 Reuse before invention

Before creating a new component:

1. Check whether an existing component can support the requirement.
2. Add a controlled variant where appropriate.
3. Create a new component only when the interaction pattern is genuinely different.

### 2.2 Keep components focused

A component should have one clear responsibility.

Good:

```text
ProjectCard
TaskCard
BoardColumn
FileRow
StatusBadge
```

Bad:

```text
ProjectDashboardEverythingCard
ReusableUniversalPanel
GenericDataDisplayWidget
```

### 2.3 Separate presentation and logic

Presentational components should receive data and callbacks through props.

Business logic belongs in:

- Feature hooks
- Services
- Server actions
- Query functions
- State stores

### 2.4 Components must support all states

Every component must account for:

- Default
- Hover
- Focus
- Active
- Disabled
- Loading
- Empty
- Error
- Read-only

### 2.5 Accessibility is mandatory

Reusable components must support:

- Keyboard navigation
- Visible focus
- Semantic HTML
- Screen-reader labels
- Correct ARIA attributes
- Sufficient contrast

---

# 3. Foundations

## 3.1 `AppShell`

### Purpose

Provides the primary application frame.

### Anatomy

```text
AppShell
├── Sidebar
├── TopBar
├── MainContent
└── Optional DetailDrawer
```

### Props

```typescript
interface AppShellProps {
  children: React.ReactNode;
  sidebarCollapsed?: boolean;
  detailDrawer?: React.ReactNode;
}
```

### Behaviour

- Sidebar is fixed on desktop.
- Main content scrolls independently.
- Sidebar becomes a drawer on tablet and mobile.
- Detail drawer appears on the right on desktop.
- Detail drawer becomes full-screen on mobile.

### Accessibility

- Main content uses `<main>`.
- Sidebar uses `<nav>`.
- Skip-to-content link appears first in keyboard order.

---

## 3.2 `Sidebar`

### Purpose

Provides primary application navigation.

### Navigation Items

```text
Overview
Projects
Board
My Tasks
Calendar
Files
Settings
```

### Anatomy

```text
Sidebar
├── Logo
├── Navigation
├── Spacer
└── UserProfileSummary
```

### Visual Rules

- Background: Ocean Light `#8AADB8`
- Default text: Ink Deep
- Selected item: Midnight background with white text
- Hover: translucent white background
- Width: `240px`
- Collapsed width: `72px`

### States

- Expanded
- Collapsed
- Mobile drawer
- Loading user profile

### Accessibility

- Navigation items use links.
- Active link includes `aria-current="page"`.
- Collapsed icon buttons include tooltips and labels.

---

## 3.3 `TopBar`

### Purpose

Provides global search, notifications, and user access.

### Anatomy

```text
TopBar
├── Breadcrumb or PageContext
├── GlobalSearch
├── NotificationButton
└── UserMenu
```

### Rules

Do not display greeting copy such as:

```text
Good morning, Marcus
```

The right-hand area must display the user profile rather than duplicate HIMARK branding.

---

## 3.4 `PageHeader`

### Purpose

Introduces the page and exposes its primary action.

### Anatomy

```text
PageHeader
├── TitleBlock
│   ├── Title
│   └── Description
└── Actions
```

### Props

```typescript
interface PageHeaderProps {
  title: string;
  description?: string;
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}
```

### Rules

- One primary action maximum.
- Description should be one sentence.
- Page title uses H1 styling.
- Avoid summary cards inside the header.

---

# 4. Navigation Components

## 4.1 `NavItem`

### Purpose

Represents a primary or settings navigation link.

### Variants

```text
default
active
collapsed
nested
```

### States

```text
default
hover
focus
active
disabled
```

### Accessibility

- Use anchor semantics.
- Include accessible name when icon-only.
- Active state must not rely on colour alone.

---

## 4.2 `Breadcrumbs`

### Purpose

Shows hierarchy and supports navigation.

### Example

```text
Projects / Website Redesign / Files
```

### Rules

- Maximum recommended depth: 4.
- Current page is not a link.
- Collapse middle items on mobile.

---

## 4.3 `Tabs`

### Purpose

Switches between related views inside a project or settings section.

### Example

```text
Overview
Board
Files
Calendar
Activity
Settings
```

### Variants

```text
underline
contained
compact
```

### Accessibility

- Use `role="tablist"`.
- Support arrow-key navigation.
- Selected tab uses `aria-selected="true"`.

---

## 4.4 `SettingsNav`

### Purpose

Provides settings section navigation.

### Items

```text
My Profile
Account
Workspace
Team
Notifications
Task Preferences
Project Templates
Integrations
```

### Account Sub-navigation

```text
Account Information
Email & Password
Security
Sessions
Connected Devices
Deactivate Account
```

### Rules

- Billing must not appear.
- Nested navigation should remain shallow.
- Mobile uses a dropdown or sheet.

---

# 5. Action Components

## 5.1 `Button`

### Purpose

Triggers an action.

### Variants

```text
primary
secondary
tertiary
ghost
destructive
```

### Sizes

```text
sm
md
lg
```

### Props

```typescript
interface ButtonProps {
  variant?: "primary" | "secondary" | "tertiary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}
```

### Behaviour

- Loading state preserves width.
- Disabled state blocks interaction.
- Destructive buttons require confirmation for irreversible actions.

### Accessibility

- Icon-only buttons require `aria-label`.
- Loading state uses `aria-busy="true"`.

---

## 5.2 `IconButton`

### Purpose

Supports compact actions.

### Examples

- More actions
- Close
- Notifications
- Search
- Filter
- Edit

### Sizes

```text
sm: 32px
md: 40px
lg: 44px
```

### Rules

- Always include tooltip.
- Never use for unfamiliar primary actions.

---

## 5.3 `SplitButton`

### Purpose

Provides one primary action with closely related alternatives.

### Example

```text
New Task ▼
```

Alternative actions:

```text
Create task
Create from template
Create subtask
```

Use sparingly.

---

## 5.4 `DropdownMenu`

### Purpose

Contains contextual actions.

### Rules

- Primary actions remain visible.
- Destructive items are separated.
- Menu closes on selection, outside click, or Escape.
- Keyboard navigation is required.

---

## 5.5 `CommandPalette`

### Purpose

Provides fast keyboard-driven access.

### Shortcut

```text
Ctrl + K
Command + K
```

### Commands

```text
Search projects
Create task
Open board
Open calendar
Upload file
Open settings
```

### Behaviour

- Fuzzy search
- Keyboard selection
- Recent commands
- Grouped actions

---

# 6. Form Components

## 6.1 `FormField`

### Purpose

Standard wrapper for labels, controls, help text, and errors.

### Anatomy

```text
FormField
├── Label
├── Description
├── Control
└── ErrorMessage
```

### Props

```typescript
interface FormFieldProps {
  label: string;
  description?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}
```

### Accessibility

- Label connects to control using `htmlFor`.
- Error uses `aria-describedby`.
- Required state is announced.

---

## 6.2 `TextInput`

### Types

```text
text
email
password
search
url
tel
```

### States

```text
default
hover
focus
filled
disabled
error
read-only
```

### Rules

- Default height: `40px`
- Large height: `48px`
- Placeholder is supplementary only.
- Error appears below input.

---

## 6.3 `Textarea`

### Purpose

Captures descriptions, comments, and notes.

### Behaviour

- Auto-resize where useful.
- Minimum 3 rows.
- Maximum height before internal scrolling.
- Character count only where a limit exists.

---

## 6.4 `Select`

### Purpose

Supports single selection from a controlled list.

### Examples

- Project status
- Priority
- Assignee
- Timezone
- Default task state

### Behaviour

- Searchable when options exceed 8.
- Clearable only where null is valid.
- Selected option remains visible.

---

## 6.5 `MultiSelect`

### Purpose

Supports multiple values.

### Examples

- Labels
- Project members
- Calendar attendees

### Rules

- Show selected values as chips.
- Collapse overflow into `+N`.
- Support keyboard removal.

---

## 6.6 `Checkbox`

### Purpose

Supports binary or multi-select choices.

### States

```text
unchecked
checked
indeterminate
disabled
```

Use checkboxes when multiple options may be selected independently.

---

## 6.7 `RadioGroup`

### Purpose

Supports one choice from a visible set.

### Examples

- Default project view
- Theme
- Notification frequency

---

## 6.8 `Switch`

### Purpose

Controls immediate on/off settings.

### Examples

- Email notifications
- Browser notifications
- Show completed tasks

### Rules

- Apply immediately where safe.
- Do not use for actions requiring confirmation.
- Label must describe the enabled state.

---

## 6.9 `DatePicker`

### Purpose

Selects a date or date range.

### Examples

- Project dates
- Task due date
- Calendar events

### Behaviour

- Keyboard entry supported.
- Uses workspace date format.
- Past-date restrictions only where logically required.

---

## 6.10 `TimePicker`

### Purpose

Selects time values.

### Rules

- Respect 12-hour or 24-hour preference.
- Support keyboard input.
- Use timezone-aware storage for events.

---

## 6.11 `FileUpload`

### Purpose

Uploads files to projects or tasks.

### Variants

```text
button
dropzone
compact
```

### States

```text
idle
drag-over
uploading
success
error
disabled
```

### Behaviour

- Shows upload progress.
- Validates size and file type before upload.
- Supports retry.
- Prevents duplicate accidental uploads where practical.

### Accessibility

- Dropzone is keyboard operable.
- File input remains available.
- Upload progress is announced.

---

# 7. Data Display Components

## 7.1 `Card`

### Purpose

Groups related information.

### Variants

```text
default
interactive
selected
subtle
danger
```

### Rules

- Cards should not all use the same structure.
- Interactive cards must have clear hover and focus states.
- Avoid nested card overload.

---

## 7.2 `SummaryCard`

### Purpose

Displays one high-level value.

### Examples

```text
Active Projects
Tasks Due Today
Overdue Tasks
Upcoming Deadlines
```

### Anatomy

```text
SummaryCard
├── Label
├── Value
├── Optional supporting text
└── Optional action
```

### Rules

- Use only on Overview.
- Avoid placing summary cards on every page.
- No money metrics.

---

## 7.3 `ProjectCard`

### Purpose

Represents a project in card view.

### Content

- Project name
- Status
- Progress
- Owner
- Team avatars
- Due date
- Task count
- Favourite control

### States

```text
default
hover
selected
archived
loading
```

### Behaviour

- Clicking opens the project.
- Overflow menu contains secondary actions.
- Favourite control does not trigger card navigation.

---

## 7.4 `ProjectRow`

### Purpose

Represents a project in table view.

### Columns

```text
Project
Status
Owner
Progress
Team
Due date
Tasks
Actions
```

### Rules

- Entire row may be clickable.
- Actions remain separately operable.
- Archived projects appear muted.

---

## 7.5 `TaskCard`

### Purpose

Represents a task on the Kanban board.

### Content

- Title
- Project name when in all-project view
- Priority
- Assignee
- Due date
- Labels
- Attachment count
- Comment count

### Variants

```text
default
dragging
selected
blocked
overdue
completed
```

### Rules

- Keep compact.
- Do not display the full description.
- Show blocked and overdue states clearly.
- Use drag handle where necessary.

---

## 7.6 `TaskRow`

### Purpose

Represents a task in My Tasks or list views.

### Columns

```text
Task
Project
Status
Priority
Assignee
Due date
```

### Behaviour

- Opens task detail drawer.
- Supports inline completion.
- Supports selection for bulk actions.

---

## 7.7 `StatusBadge`

### Purpose

Communicates status.

### Task Statuses

```text
Backlog
To Do
In Progress
Review
Done
```

### Project Statuses

```text
Not Started
Active
On Hold
Completed
Archived
```

### Rules

- Use text plus colour.
- Keep labels short.
- Avoid bright decorative colours.

---

## 7.8 `PriorityBadge`

### Values

```text
Low
Medium
High
Urgent
```

### Rules

- Urgent uses semantic danger.
- High uses warning.
- Medium and Low use neutral/HIMARK tones.
- Priority should not overpower task title.

---

## 7.9 `LabelChip`

### Purpose

Displays a task or project label.

### Examples

```text
Design
Development
Blocked
Client Input
Internal
```

### Behaviour

- Can be removable in edit mode.
- May open label filter when clicked.
- Uses workspace-approved colour tokens.

---

## 7.10 `Avatar`

### Purpose

Represents a user.

### Sizes

```text
xs
sm
md
lg
xl
```

### Behaviour

- Uses image when available.
- Falls back to initials.
- Tooltip displays full name and role where useful.

---

## 7.11 `AvatarGroup`

### Purpose

Displays multiple members compactly.

### Rules

- Maximum visible avatars: 4 or 5.
- Remaining count shown as `+N`.
- Overlap no more than 8px.

---

## 7.12 `ProgressBar`

### Purpose

Displays completion progress.

### Variants

```text
project
task
upload
```

### Rules

- Use HIMARK palette.
- Pair with numeric or textual value.
- Do not use decorative gradients.

---

## 7.13 `EmptyState`

### Purpose

Explains an empty view and provides the next action.

### Anatomy

```text
Icon
Title
Description
Primary action
Optional secondary action
```

### Example

```text
No tasks assigned

Tasks assigned to you will appear here.

[View Board]
```

---

## 7.14 `Skeleton`

### Purpose

Preserves layout during loading.

### Variants

```text
text
card
table-row
task-card
avatar
```

### Rules

- Match final component dimensions.
- Avoid excessive animation.
- Respect reduced-motion preference.

---

# 8. Feedback Components

## 8.1 `Toast`

### Purpose

Confirms success or reports recoverable failure.

### Variants

```text
success
error
warning
info
```

### Examples

```text
Task moved to Review.
Project created.
File uploaded.
Unable to save changes.
```

### Rules

- Maximum three visible.
- Auto-dismiss non-critical messages.
- Provide Undo when practical.

---

## 8.2 `Alert`

### Purpose

Displays persistent contextual information.

### Variants

```text
info
success
warning
danger
```

### Use Cases

- Security notice
- Integration warning
- Project archived notice
- Upload restrictions

---

## 8.3 `InlineError`

### Purpose

Displays field-level or section-level failure.

### Rules

- Explain the issue.
- Provide a corrective action.
- Do not expose technical details.

---

## 8.4 `ConfirmationDialog`

### Purpose

Confirms destructive or high-impact actions.

### Examples

- Delete task
- Archive project
- Remove member
- Deactivate account

### Anatomy

```text
Title
Consequence
Cancel
Confirm action
```

### Rules

- Confirm button names the action.
- Destructive action uses danger treatment.
- Default focus remains on Cancel for severe actions.

---

## 8.5 `ProgressIndicator`

### Purpose

Shows long-running progress.

### Examples

- File upload
- Bulk task update
- Template creation

Use determinate progress whenever possible.

---

# 9. Overlay Components

## 9.1 `Modal`

### Purpose

Handles focused creation and confirmation workflows.

### Sizes

```text
sm: 400px
md: 560px
lg: 720px
```

### Rules

- Trap focus.
- Close on Escape unless action is critical.
- Restore focus to trigger on close.
- Avoid using modals for complex multi-screen work.

---

## 9.2 `Drawer`

### Purpose

Displays detail without losing page context.

### Use Cases

- Task detail
- Project detail
- File detail
- Filter panel on mobile

### Width

```text
400px–480px desktop
full-screen mobile
```

### Behaviour

- Supports deep linking for task and file details.
- Escape closes.
- Background content remains visible but inactive.

---

## 9.3 `Popover`

### Purpose

Displays lightweight contextual controls.

### Examples

- Assignee picker
- Date picker
- Label picker
- Quick filters

Use only for short interactions.

---

## 9.4 `Tooltip`

### Purpose

Explains icons or abbreviated information.

### Rules

- Appears after brief delay.
- Never contains critical information.
- Must not be the only accessible label.

---

# 10. Board Components

## 10.1 `KanbanBoard`

### Purpose

Displays and manages tasks across columns.

### Anatomy

```text
KanbanBoard
├── BoardToolbar
├── BoardColumn[]
└── DragOverlay
```

### Props

```typescript
interface KanbanBoardProps {
  columns: BoardColumnData[];
  tasks: Task[];
  filters: BoardFilters;
  onTaskMove: (input: MoveTaskInput) => Promise<void>;
  onTaskOpen: (taskId: string) => void;
  onTaskCreate: (columnId?: string) => void;
}
```

### Behaviour

- Horizontal scroll.
- Drag and drop.
- Keyboard movement.
- Optimistic updates.
- Rollback on failure.
- Empty column drop zones remain visible.

---

## 10.2 `BoardToolbar`

### Purpose

Controls the board view.

### Controls

```text
Project selector
Search
Assignee filter
Priority filter
Label filter
View options
New Task
```

### Rules

- Keep one line on desktop.
- Collapse secondary filters into a filter drawer on smaller screens.
- Do not add KPI cards above the board.

---

## 10.3 `BoardColumn`

### Purpose

Groups tasks by status.

### Anatomy

```text
ColumnHeader
TaskCount
AddTaskButton
TaskList
```

### States

```text
default
drag-over
collapsed
empty
loading
```

### Rules

- Minimum width: 280px
- Maximum suggested width: 340px
- Header remains visible while column scrolls where practical
- WIP limit may appear later but is not required for MVP

---

## 10.4 `DragOverlay`

### Purpose

Provides a readable task preview while dragging.

### Rules

- Retains card dimensions.
- Uses elevated shadow.
- Does not duplicate every metadata element.
- Announces movement to screen readers.

---

## 10.5 `QuickTaskCreate`

### Purpose

Creates a task inside a selected column.

### Fields

```text
Title
Optional assignee
Optional due date
```

Additional details are edited after creation.

---

# 11. Project Components

## 11.1 `ProjectDirectory`

### Purpose

Displays all projects.

### Supported Views

```text
table
cards
```

### Controls

```text
Search
Status filter
Owner filter
Favourite filter
Sort
New Project
```

---

## 11.2 `CreateProjectDialog`

### Fields

```text
Project name
Description
Owner
Status
Priority
Start date
Due date
Template
Members
```

### Validation

- Name required
- Owner required
- Due date cannot precede start date

---

## 11.3 `ProjectProgress`

### Purpose

Shows overall progress.

### Calculation

```text
Completed active tasks / Total active tasks × 100
```

### Rules

- Display percentage and bar.
- Archived tasks excluded.
- Empty project shows `0%`.

---

## 11.4 `ProjectMemberList`

### Purpose

Displays and manages project membership.

### Content

```text
Avatar
Name
Project role
Actions
```

### Roles

```text
Project Owner
Project Manager
Contributor
Viewer
```

---

## 11.5 `ProjectActivityFeed`

### Purpose

Displays immutable project activity.

### Event Examples

```text
Task created
Task moved
Comment added
File uploaded
Member added
Project archived
```

### Rules

- Newest first by default.
- Group events by date.
- Support pagination or load more.

---

# 12. Task Components

## 12.1 `TaskDetailDrawer`

### Purpose

Provides full task editing and collaboration.

### Sections

```text
Header
Description
Properties
Subtasks
Attachments
Comments
Activity
```

### Header Actions

```text
Complete
More actions
Close
```

### Properties

```text
Status
Priority
Assignee
Due date
Project
Labels
```

---

## 12.2 `SubtaskList`

### Purpose

Displays direct child tasks.

### Behaviour

- Inline create.
- Inline complete.
- Open child detail.
- Optional reorder.

Limit nesting to one or two levels.

---

## 12.3 `CommentComposer`

### Purpose

Adds comments and mentions.

### Features

```text
Plain text
Mentions
Attachments
Submit
```

### Rules

- Keep editor lightweight.
- Do not build a complex document editor for MVP.
- Support `@mention`.

---

## 12.4 `CommentThread`

### Purpose

Displays task discussion.

### Content

```text
Author
Timestamp
Comment
Edited state
Reply
Actions
```

### Rules

- Soft-delete comments.
- Show `Comment deleted` when needed for thread continuity.

---

## 12.5 `AssigneePicker`

### Purpose

Selects a responsible task owner.

### Rules

- Only active project members appear.
- Search by name or role.
- Clear ownership is mandatory where task assignment is required.

---

# 13. My Tasks Components

## 13.1 `MyTasksList`

### Purpose

Displays the current user's work.

### Groups

```text
Overdue
Due Today
Upcoming
Completed
```

### Controls

```text
Search
Project filter
Priority filter
Status filter
Sort
```

### Rules

- Overdue appears first.
- Completed group is collapsed by default.
- No team-wide analytics.

---

## 13.2 `TaskGroup`

### Purpose

Groups tasks by timing or status.

### States

```text
expanded
collapsed
empty
loading
```

---

# 14. Calendar Components

## 14.1 `CalendarView`

### Supported Views

```text
month
week
day
```

### Content

```text
Meetings
Deadlines
Milestones
Reminders
```

### Rules

- Use restrained HIMARK colours.
- Overdue may use semantic danger.
- Current day must be clear.

---

## 14.2 `CalendarToolbar`

### Controls

```text
Previous
Today
Next
Month / Week / Day
Filters
New Event
```

---

## 14.3 `CalendarEvent`

### Content

```text
Title
Time
Project
Event type
```

### Behaviour

- Clicking opens event detail.
- Task deadlines may open task detail.
- Drag rescheduling is optional for later phases.

---

## 14.4 `EventDialog`

### Fields

```text
Title
Type
Project
Related task
Start
End
All day
Attendees
Location
Description
```

---

# 15. File Components

## 15.1 `FileBrowser`

### Purpose

Displays project and global files.

### Supported Views

```text
list
grid
```

### Controls

```text
Breadcrumbs
Search
Project filter
File type filter
Upload
New folder
Sort
```

---

## 15.2 `FileRow`

### Columns

```text
Name
Project
Owner
Modified
Size
Actions
```

### Behaviour

- Click opens preview or detail drawer.
- Double-click folder opens it.
- Overflow menu contains rename, move, download, delete.

---

## 15.3 `FileCard`

### Purpose

Grid representation of a file or folder.

### Content

```text
Type icon or preview
Name
Project
Modified date
Owner
```

---

## 15.4 `FilePreview`

### Supported Preview Types

```text
PDF
Image
Plain text
Common office file metadata
```

Unsupported types show metadata and download action.

---

## 15.5 `FolderTree`

### Purpose

Supports folder navigation.

### Rules

- Limit nesting depth.
- Highlight current folder.
- Support keyboard expansion.

---

# 16. Settings Components

## 16.1 `SettingsSection`

### Purpose

Groups related settings.

### Anatomy

```text
Title
Description
Fields or controls
Optional save action
```

### Rules

- Use clear section headings.
- Avoid unnecessary cards inside cards.
- Use sticky save bar for long forms.

---

## 16.2 `ProfileForm`

### Fields

```text
Avatar
First name
Last name
Display name
Phone number
Job title
Department
Timezone
Locale
```

---

## 16.3 `AccountSecurityCard`

### Use Cases

```text
Password
Two-factor authentication
Sessions
Connected devices
```

### Rules

- Security state is explicit.
- Sensitive actions require re-authentication where supported.

---

## 16.4 `SessionRow`

### Content

```text
Device
Browser
Location
Last active
Current session indicator
Log out action
```

---

## 16.5 `ConnectedDeviceRow`

### Content

```text
Device name
Device type
Last seen
Status
Remove action
```

---

## 16.6 `TeamTable`

### Columns

```text
Member
Email
Role
Status
Joined
Actions
```

### Actions

```text
Change role
Deactivate
Remove
Resend invitation
```

---

## 16.7 `NotificationPreferenceMatrix`

### Purpose

Controls channels per notification type.

### Columns

```text
Notification type
In-app
Email
Browser
```

### Rules

- Use switches or checkboxes consistently.
- Preserve row and column labels on mobile.
- Do not require a separate save for each row unless technically necessary.

---

## 16.8 `TaskPreferencesForm`

### Fields

```text
Default priority
Default status
Default project view
Show completed tasks
Compact mode
Week start
Working hours
```

---

## 16.9 `TemplateCard`

### Content

```text
Template name
Description
Category
Column count
Task count
Last updated
Actions
```

### Actions

```text
Use template
Edit
Duplicate
Archive
```

---

## 16.10 `IntegrationCard`

### Content

```text
Provider logo
Name
Description
Connection status
Connect / Disconnect
```

### Rules

- Integrations are secondary to core product functionality.
- Do not introduce integrations before core workflows are stable.

---

# 17. Search Components

## 17.1 `GlobalSearch`

### Purpose

Searches across:

```text
Projects
Tasks
Files
Team members
```

### Behaviour

- Debounced input.
- Results grouped by entity.
- Keyboard navigation.
- Recent searches optional.
- Empty and error states included.

---

## 17.2 `SearchResultItem`

### Content

```text
Icon
Title
Supporting context
Entity type
Optional metadata
```

Example:

```text
Build homepage
Website Redesign · Task · Due 24 Jul
```

---

# 18. Notification Components

## 18.1 `NotificationBell`

### Purpose

Displays unread count and opens notifications.

### Rules

- Badge caps at `99+`.
- No badge when unread count is zero.
- Accessible label includes unread count.

---

## 18.2 `NotificationPanel`

### Groups

```text
New
Earlier
```

### Actions

```text
Mark as read
Mark all as read
Open related item
```

### Notification Types

```text
Task assigned
Mention
Due today
Overdue
Review requested
Task completed
File uploaded
System
```

---

## 18.3 `NotificationItem`

### Content

```text
Icon
Title
Message
Time
Unread indicator
```

Clicking opens the related entity.

---

# 19. Responsive Behaviour

## Desktop

- Full sidebar
- Multi-column layouts
- Right-side drawers
- Table views
- Full Kanban board

## Tablet

- Collapsible sidebar
- Reduced page padding
- Horizontal board scrolling
- Simplified tables
- Drawer overlays main content

## Mobile

- Sidebar becomes sheet
- Page actions may become sticky
- Tables become cards
- Modals become full-screen where necessary
- Kanban remains horizontally scrollable
- Task drawer becomes full-screen
- Filters move into a dedicated sheet

---

# 20. Component State Matrix

Every component should explicitly support relevant states.

| Component | Loading | Empty | Error | Disabled | Read-only |
|---|---:|---:|---:|---:|---:|
| ProjectDirectory | Yes | Yes | Yes | No | Yes |
| KanbanBoard | Yes | Yes | Yes | Yes | Yes |
| MyTasksList | Yes | Yes | Yes | No | Yes |
| CalendarView | Yes | Yes | Yes | Yes | Yes |
| FileBrowser | Yes | Yes | Yes | Yes | Yes |
| TeamTable | Yes | Yes | Yes | Yes | Yes |
| TemplateList | Yes | Yes | Yes | Yes | Yes |
| NotificationPanel | Yes | Yes | Yes | No | No |
| TaskDetailDrawer | Yes | No | Yes | Yes | Yes |

---

# 21. Suggested Component Folder Structure

```text
components/
├── ui/
│   ├── alert/
│   ├── avatar/
│   ├── badge/
│   ├── button/
│   ├── checkbox/
│   ├── dialog/
│   ├── drawer/
│   ├── dropdown-menu/
│   ├── input/
│   ├── popover/
│   ├── progress/
│   ├── radio-group/
│   ├── select/
│   ├── skeleton/
│   ├── switch/
│   ├── tabs/
│   ├── textarea/
│   ├── toast/
│   └── tooltip/
│
├── layout/
│   ├── app-shell.tsx
│   ├── sidebar.tsx
│   ├── top-bar.tsx
│   ├── page-header.tsx
│   └── content-container.tsx
│
├── navigation/
│   ├── nav-item.tsx
│   ├── breadcrumbs.tsx
│   ├── settings-nav.tsx
│   └── command-palette.tsx
│
├── projects/
│   ├── project-card.tsx
│   ├── project-row.tsx
│   ├── project-directory.tsx
│   ├── project-progress.tsx
│   └── create-project-dialog.tsx
│
├── board/
│   ├── kanban-board.tsx
│   ├── board-toolbar.tsx
│   ├── board-column.tsx
│   ├── task-card.tsx
│   ├── drag-overlay.tsx
│   └── quick-task-create.tsx
│
├── tasks/
│   ├── task-row.tsx
│   ├── task-detail-drawer.tsx
│   ├── subtask-list.tsx
│   ├── assignee-picker.tsx
│   ├── comment-composer.tsx
│   └── comment-thread.tsx
│
├── calendar/
│   ├── calendar-view.tsx
│   ├── calendar-toolbar.tsx
│   ├── calendar-event.tsx
│   └── event-dialog.tsx
│
├── files/
│   ├── file-browser.tsx
│   ├── file-row.tsx
│   ├── file-card.tsx
│   ├── file-preview.tsx
│   ├── file-upload.tsx
│   └── folder-tree.tsx
│
├── settings/
│   ├── settings-section.tsx
│   ├── profile-form.tsx
│   ├── account-security-card.tsx
│   ├── session-row.tsx
│   ├── connected-device-row.tsx
│   ├── team-table.tsx
│   ├── notification-preference-matrix.tsx
│   ├── task-preferences-form.tsx
│   ├── template-card.tsx
│   └── integration-card.tsx
│
├── search/
│   ├── global-search.tsx
│   └── search-result-item.tsx
│
└── notifications/
    ├── notification-bell.tsx
    ├── notification-panel.tsx
    └── notification-item.tsx
```

---

# 22. Testing Requirements

Reusable components should include:

## Unit Tests

- Variant rendering
- Disabled states
- Loading states
- Error states
- Event callbacks
- Validation

## Accessibility Tests

- Keyboard support
- Focus management
- Accessible labels
- ARIA state
- Dialog focus trap

## Interaction Tests

- Kanban drag and drop
- Dropdown keyboard navigation
- Modal open and close
- File upload states
- Notification actions
- Task editing

## Visual Regression

Recommended for:

- Sidebar
- Page header
- Buttons
- Cards
- Kanban board
- Task drawer
- Settings forms
- Calendar
- File browser

---

# 23. Component Acceptance Checklist

Before a component is approved:

- It has one clear purpose.
- It follows HIVE tokens.
- It supports keyboard use.
- It has visible focus.
- It includes loading, error, and empty states where relevant.
- It works on mobile, tablet, and desktop.
- It does not introduce random colours.
- It does not duplicate an existing component.
- It does not contain business logic that belongs in a service or feature hook.
- It has tests.
- It has documented props and variants.
- It is consistent with `design-system.md`.

---

# 24. Anti-Patterns

Do not create:

- Generic universal cards with dozens of optional props
- Components tied to one page but placed in global UI
- Buttons without clear accessible names
- Modals for simple inline edits
- Tables where a board, list, or calendar is more appropriate
- KPI components on every page
- Components containing direct database queries
- One-off colour variants
- Nested cards without clear hierarchy
- Hidden primary actions
- Complex editors where plain text is sufficient

---

# 25. Source of Truth

This file is the implementation reference for HIVE's reusable interface components.

When a new component is proposed:

1. Confirm an existing component cannot support the need.
2. Define its purpose and anatomy.
3. Define all states.
4. Define accessibility behaviour.
5. Add it to this document.
6. Add tests before broad reuse.

HIVE should remain a focused system made from a small number of predictable, high-quality components.
