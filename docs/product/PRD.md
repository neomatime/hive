# HIVE

## Product Requirements Document (PRD)

### Version

1.0 (MVP)

### Product

HIVE

### Organisation

HIMARK

---

# 1. Product Overview

## Vision

HIVE is HIMARK's internal project management platform.

It provides a single place for the HIMARK team to plan projects, assign work, collaborate, manage files, and track delivery.

HIVE is **not** intended to be sold as a SaaS product. It exists to improve HIMARK's internal execution and operational efficiency.

---

# 2. Product Goal

The goal of HIVE is simple:

> Help the HIMARK team know what needs to be done, who is responsible for it, and when it needs to be completed.

Everything in the application should support that objective.

---

# 3. Out of Scope

HIVE is **not** a:

* CRM
* Finance platform
* Billing system
* HR system
* Sales pipeline
* Business Intelligence platform
* Client Portal
* Chat application

Future integrations may exist, but HIVE will remain a dedicated project management platform.

---

# 4. Target Users

## Primary Users

* HIMARK Directors
* Project Managers
* Consultants
* Designers
* Developers
* Marketing Team
* Operations

---

# 5. Product Principles

HIVE should always be:

* Simple
* Fast
* Beautiful
* Focused
* Easy to learn
* Minimal
* Consistent

If a feature makes the product more complicated without significantly improving delivery, it should not be built.

---

# 6. Navigation

* Overview
* Projects
* Board
* Inbox
* Calendar
* Files
* Settings

---

# 7. Core Features

## 7.1 Overview

Purpose:

Provide a high-level snapshot of current work.

Features:

* Active Projects
* Tasks Due Today
* Overdue Tasks
* Upcoming Deadlines
* Recent Activity
* Quick Actions

No Kanban board should appear on this page.

---

## 7.2 Projects

Purpose:

Manage all HIMARK projects.

Features:

* Project List
* Search
* Filters
* Create Project
* Archive Project
* Favourite Projects

Each project contains:

* Overview
* Board
* Files
* Calendar
* Activity
* Settings

---

## 7.3 Board

Purpose:

The primary workspace for delivery.

Features:

* Kanban Board
* Drag and Drop
* Backlog
* To Do
* In Progress
* Review
* Done

Users can switch between:

* All Projects
* Individual Project

---

## 7.4 Inbox

Purpose:

Show work assigned to the current user.

Features:

* Assigned Tasks
* Mentions
* Review Requests
* Due Today
* Overdue
* Notifications

---

## 7.5 Calendar

Purpose:

Visualise work over time.

Features:

* Monthly View
* Weekly View
* Daily View
* Meetings
* Deadlines
* Milestones

---

## 7.6 Files

Purpose:

Store project documentation.

Features:

* Project Folders
* Upload Files
* Search
* Preview
* Download
* Version Information

---

## 7.7 Settings

Modules:

### My Profile

* Personal Information
* Avatar

### Account

* Information
* Email & Password
* Security
* Sessions
* Connected Devices
* Deactivate Account

### Workspace

Workspace configuration.

### Team

Invite and manage members.

### Notifications

Notification preferences.

### Task Preferences

Default task settings.

### Project Templates

Create reusable project structures.

### Integrations

Manage third-party integrations.

---

# 8. Project Structure

Every project contains:

* Overview
* Board
* Files
* Calendar
* Activity
* Settings

---

# 9. Task Lifecycle

Backlog

↓

To Do

↓

In Progress

↓

Review

↓

Done

Tasks may move backwards if rework is required.

---

# 10. Task Model

Every task contains:

* Title
* Description
* Assignee
* Priority
* Due Date
* Labels
* Attachments
* Comments
* Activity History

---

# 11. Project Lifecycle

Not Started

↓

Active

↓

On Hold

↓

Completed

↓

Archived

---

# 12. User Roles

## Owner

Full access.

## Admin

Workspace management.

## Project Manager

Manage assigned projects.

## Contributor

Create and update work.

## Viewer

Read-only access.

---

# 13. Design Principles

Interface should use:

Background

* Off White (#F7F7F5)

Cards

* White

Sidebar

* Ocean Light (#8AADB8)

Primary Colour

* Midnight (#1C2B3A)

Accent

* Ocean (#5F8190)

Typography

* Ink Deep (#0E1822)

Design characteristics:

* Minimal
* Spacious
* Rounded corners
* Soft shadows
* Large typography
* Consistent spacing

Avoid unnecessary charts and visual noise.

---

# 14. Notifications

Notify users when:

* Assigned a task
* Mentioned
* Due today
* Task overdue
* Review requested
* Task completed

---

# 15. Search

Global search should support:

* Projects
* Tasks
* Files
* Team Members

---

# 16. Project Templates

Templates should include:

* Default Board
* Default Columns
* Default Tasks
* Labels
* Suggested Milestones

Creating a project from a template should automatically generate its structure.

---

# 17. Technical Stack

Frontend

* Next.js
* TypeScript
* Tailwind CSS
* shadcn/ui

Backend

* Supabase

Database

* PostgreSQL

Authentication

* Supabase Auth

Storage

* Supabase Storage

Deployment

* Vercel

---

# 18. MVP Scope

## Phase 1

* Authentication
* Workspace
* Projects
* Board
* Tasks
* Files
* Calendar
* Notifications
* Settings

## Phase 2

* Project Templates
* Activity Feed
* Advanced Search
* Keyboard Shortcuts

## Phase 3

* Integrations
* Automation
* AI Assistance

---

# 19. Success Metrics

HIVE will be considered successful if:

* Every HIMARK project is managed inside HIVE.
* The team no longer relies on spreadsheets for project tracking.
* All active tasks are assigned and visible.
* Team members can identify their priorities in under 30 seconds.
* New projects can be created from a template in under one minute.

---

# 20. Product Philosophy

HIVE is not designed to become the most feature-rich project management platform.

It is designed to become the simplest and most reliable place where HIMARK plans, organises, and delivers work.

Every feature should make project execution clearer, faster, and easier.
