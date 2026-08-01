# HIVE

## Functional Requirements Specification (FRS)

### Version

1.0 (MVP)

### Product

HIVE

### Organisation

HIMARK

---

# 1. Purpose

This document defines the functional behaviour of HIVE.

It serves as the reference for:

* Software Development
* UI/UX
* Testing
* Future Enhancements

Every feature described below must have corresponding implementation and test cases.

---

# 2. User Roles

## Owner

Permissions

* Full workspace access
* Manage workspace
* Manage team
* Manage templates
* Delete projects
* Manage settings

---

## Admin

Permissions

* Manage projects
* Manage members
* Manage templates
* Configure workspace
* View activity

---

## Project Manager

Permissions

* Create projects
* Update projects
* Create tasks
* Assign work
* Upload files
* Manage board

---

## Contributor

Permissions

* View assigned projects
* Create tasks
* Update assigned tasks
* Comment
* Upload files

---

## Viewer

Permissions

* View projects
* View tasks
* View files
* View calendar

No editing permissions.

---

# 3. Authentication

## FR-001

The system shall authenticate users using Supabase Authentication.

Acceptance Criteria

* Login
* Logout
* Password Reset
* Session Persistence

---

## FR-002

Only authenticated users may access the application.

---

# 4. Overview

Purpose

Provide a summary of current work.

---

## FR-010

The Overview page shall display:

* Active Projects
* Tasks Due Today
* Overdue Tasks
* Upcoming Deadlines
* Recent Activity

---

## FR-011

The Overview page shall not display the Kanban board.

---

## FR-012

Each card shall navigate to its corresponding module.

Example

Tasks Due Today

↓

Inbox

---

# 5. Projects

---

## FR-020

Users shall be able to:

* Create Project
* Edit Project
* Archive Project
* Search Projects
* Favourite Projects

---

Project Fields

* Name
* Description
* Status
* Priority
* Owner
* Start Date
* Due Date
* Template

---

Validation

Project Name

Required

Maximum 255 characters

---

## FR-021

Projects shall display:

* Progress
* Team Members
* Task Count
* Due Date
* Status

---

## FR-022

Opening a project shall display

* Overview
* Board
* Files
* Calendar
* Activity
* Settings

---

# 6. Board

Purpose

Manage project work.

---

## FR-030

Board shall support

* Drag and Drop
* Keyboard Navigation
* Touch Support

---

Default Columns

Backlog

To Do

In Progress

Review

Done

---

## FR-031

Dragging a task shall immediately update

* Status
* Position
* Activity Feed

---

## FR-032

Users shall be able to

* Create Task
* Edit Task
* Delete Task
* Move Task
* Assign Task

---

# 7. Tasks

---

## FR-040

Each task shall contain

* Title
* Description
* Assignee
* Priority
* Labels
* Due Date
* Attachments
* Comments

---

## FR-041

Task Priority

* Low
* Medium
* High
* Urgent

---

## FR-042

Task Status

Backlog

↓

To Do

↓

In Progress

↓

Review

↓

Done

---

## FR-043

Users shall be able to

* Assign multiple labels
* Upload files
* Mention teammates
* Add comments

---

## FR-044

Completed tasks shall

* Receive completion timestamp
* Appear in Activity
* Trigger notifications

---

# 8. Inbox

---

## FR-050

Inbox shall display

* Assigned Tasks
* Mentioned Tasks
* Review Requests
* Due Today
* Overdue

---

## FR-051

Tasks shall be sortable by

* Due Date
* Priority
* Project
* Status

---

# 9. Calendar

---

## FR-060

Calendar Views

* Month
* Week
* Day

---

## FR-061

Calendar shall display

* Meetings
* Deadlines
* Milestones

---

## FR-062

Clicking an event shall open the corresponding

* Task
* Project
* Meeting

---

# 10. Files

---

## FR-070

Users shall

* Upload Files
* Download Files
* Rename Files
* Delete Files
* Search Files

---

Supported Types

* PDF
* DOCX
* XLSX
* PPTX
* PNG
* JPG
* ZIP

---

## FR-071

Files may belong to

* Project
* Task

---

# 11. Settings

## My Profile

FR-080

Users may

* Update Name
* Update Avatar
* Update Phone
* Update Job Title

---

## Account

FR-081

Users may

* Change Email
* Change Password

---

FR-082

Users may

* Enable Two-Factor Authentication
* View Sessions
* View Connected Devices

---

Workspace

FR-083

Owners and Admins may

* Update Workspace Name
* Update Logo
* Update Timezone

---

Team

FR-084

Admins may

* Invite Members
* Remove Members
* Change Roles

---

Notifications

FR-085

Users may configure

* In-App
* Email
* Browser

---

Task Preferences

FR-086

Users may configure

* Default Priority
* Default Status
* Week Start
* Working Hours

---

Project Templates

FR-087

Users may

* Create Template
* Edit Template
* Duplicate Template
* Archive Template

---

Integrations

FR-088

Users may

* Connect Services
* Disconnect Services

---

# 12. Search

FR-090

Global Search shall search

* Projects
* Tasks
* Files
* Team Members

Search results shall appear within 300 milliseconds where practical.

---

# 13. Notifications

FR-100

Generate notifications when

* Assigned Task
* Mention
* Due Today
* Overdue
* Review Requested
* Task Completed

---

# 14. Activity

FR-110

Record

* Project Created
* Task Created
* Task Updated
* Task Moved
* Comment Added
* File Uploaded
* Member Added

Activity is append-only.

---

# 15. Validation Rules

Projects

* Name required
* Owner required

Tasks

* Title required
* Project required
* Status required

Calendar

* End must not precede Start

Files

* Maximum upload size configurable
* Reject unsupported file types

---

# 16. Performance Requirements

Dashboard

* Load under 2 seconds

Board

* Drag updates under 200 ms

Search

* Results under 300 ms

Notifications

* Delivered within 5 seconds

---

# 17. Security Requirements

* Authentication required for all protected routes
* Role-based authorization
* HTTPS only
* Passwords never stored in plaintext
* Server-side permission validation
* Audit logging for privileged actions

---

# 18. Accessibility Requirements

The application shall:

* Support keyboard navigation
* Display visible focus indicators
* Meet WCAG 2.1 AA contrast requirements
* Include descriptive labels for form controls
* Provide screen-reader-friendly navigation

---

# 19. Error Handling

The application shall provide clear, actionable feedback for:

* Failed logins
* Validation errors
* Network interruptions
* File upload failures
* Permission denials

Errors should avoid exposing internal implementation details.

---

# 20. Acceptance Criteria

The MVP will be considered complete when:

* Users can authenticate successfully.
* Projects can be created and managed.
* Kanban boards support drag-and-drop task management.
* Tasks can be assigned, updated, and completed.
* Files can be uploaded and linked to projects or tasks.
* Calendar events can be created and viewed.
* Notifications are generated for key task events.
* Settings are fully functional according to role permissions.
* Project templates can be used to create new projects.
* All core workflows are covered by automated tests.
