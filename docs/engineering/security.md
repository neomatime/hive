# HIVE Security Specification

## 1. Purpose

This document defines the security requirements and controls for HIVE, HIMARK's internal project management platform.

Security must be enforced at every layer:

```text
User
→ Application
→ Middleware
→ Server Actions / API
→ Services
→ Database
→ Storage
```

Client-side checks improve usability. They do not provide security.

---

## 2. Security Objectives

HIVE must protect:

- User identities
- Workspace membership
- Project information
- Tasks and comments
- Uploaded files
- Calendar information
- Authentication sessions
- Administrative actions

The system must provide:

- Confidentiality
- Integrity
- Availability
- Accountability
- Least-privilege access

---

## 3. Authentication

Authentication is managed through Supabase Auth.

Required capabilities:

- Email and password login
- Password reset
- Session persistence
- Secure logout
- Email verification
- Optional multi-factor authentication
- Session revocation

Rules:

- Passwords must never be stored by HIVE.
- Authentication tokens must not be logged.
- Service-role credentials must never reach the browser.
- Protected routes must validate the session server-side.

---

## 4. Authorisation

HIVE uses role-based access control.

### Workspace Roles

```text
owner
admin
member
viewer
```

### Project Roles

```text
project_owner
project_manager
contributor
viewer
```

### Authorisation Flow

```text
Authenticated User
→ Active Workspace Membership
→ Project Membership
→ Role Permission
→ Requested Action
```

Every mutation must verify:

1. The user is authenticated.
2. The user is an active workspace member.
3. The target entity belongs to the user's workspace.
4. The user has permission for the requested action.

---

## 5. Permission Principles

- Deny by default.
- Grant the minimum access necessary.
- Validate permissions server-side.
- Do not trust hidden UI controls.
- Preserve historical ownership when users are deactivated.
- Prevent users from modifying their own elevated role unless another owner remains.

---

## 6. Row-Level Security

If Supabase is used, enable Row-Level Security on all business tables.

Core policies:

- Users may access only workspaces where they are active members.
- Users may access only projects they are authorised to view.
- Users may update only records allowed by their role.
- Users may read only their own notifications and preferences.
- Storage access must align with project and workspace access.
- Service-role access is restricted to trusted server-side operations.

No production business table should remain publicly readable.

---

## 7. Input Validation

All incoming data must be validated using Zod or an equivalent server-side schema.

Validate:

- Required fields
- Length limits
- Enum values
- UUID structure
- Date ranges
- File types
- File sizes
- Ownership relationships
- Cross-workspace references

Do not rely exclusively on database errors for user input validation.

---

## 8. File Security

Uploaded files must be stored in private Supabase Storage buckets.

Requirements:

- Signed URLs for downloads and previews
- Expiring access URLs
- MIME-type validation
- File-extension validation
- File-size limits
- Unique storage keys
- Server-side permission checks
- Malware scanning if HIVE later accepts external uploads

Recommended path:

```text
workspace/{workspaceId}/project/{projectId}/{fileId}/{filename}
```

Do not expose raw storage paths as permanent public URLs.

---

## 9. Session Security

Required controls:

- Secure, HTTP-only cookies where applicable
- Session expiration
- Token refresh
- Revocation after password change
- Logout from individual session
- Logout from all other sessions
- Display current session clearly

Sensitive actions should require re-authentication where supported.

Examples:

- Change password
- Change email
- Disable MFA
- Remove workspace owner
- Deactivate account

---

## 10. Application Security Headers

Production responses should include appropriate headers:

```text
Content-Security-Policy
Strict-Transport-Security
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
```

Frame embedding should be blocked unless explicitly required.

---

## 11. Common Vulnerability Controls

### Cross-Site Scripting

- Escape untrusted content.
- Sanitise rich text.
- Avoid unsafe HTML rendering.
- Use a strict Content Security Policy.

### Cross-Site Request Forgery

- Use framework-provided CSRF protections.
- Validate session context on mutations.
- Use same-site cookie settings.

### SQL Injection

- Use Supabase query builders or parameterised queries.
- Never construct SQL from raw user input.

### Insecure Direct Object Reference

- Validate workspace and project ownership for every record lookup.
- Never authorise access based only on possession of an ID.

### Mass Assignment

- Whitelist mutable fields.
- Do not send raw request objects directly to database update methods.

---

## 12. Secrets Management

Secrets must be stored in environment configuration.

Examples:

```text
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_JWT_SECRET
THIRD_PARTY_API_SECRET
```

Rules:

- Never commit `.env` files.
- Never expose secrets through `NEXT_PUBLIC_*`.
- Rotate secrets after suspected compromise.
- Use separate secrets per environment.

---

## 13. Audit Logging

Audit privileged and operationally important actions:

- User invited
- User removed
- Role changed
- Project created
- Project archived
- Task deleted
- File deleted
- Workspace settings changed
- Security settings changed
- Session revoked

Audit logs should contain:

- Actor
- Action
- Entity
- Timestamp
- Workspace
- Relevant non-sensitive metadata

Logs must be append-only.

---

## 14. Data Protection

- Collect only data required for HIVE operations.
- Do not store client financial information.
- Do not store credentials for external systems in plaintext.
- Soft-delete operational records where recovery is necessary.
- Define retention rules for archived projects and deleted files.
- Restrict production database access.

---

## 15. Error Handling

Security errors must not reveal internal details.

Preferred:

```text
You do not have permission to perform this action.
```

Avoid exposing:

- SQL errors
- Stack traces
- Policy names
- Internal table names
- Authentication token details

Detailed errors may be captured in secure server-side logs.

---

## 16. Dependency Security

- Use actively maintained packages.
- Enable automated dependency alerts.
- Review critical vulnerabilities immediately.
- Remove unused dependencies.
- Lock dependency versions.
- Run security audits in CI.

---

## 17. Environment Separation

Local, staging, and production must use separate:

- Supabase projects
- Databases
- Storage buckets
- Secrets
- Authentication users
- Application URLs

Production data must not be copied into local environments without sanitisation.

---

## 18. Incident Response

When a security incident is suspected:

1. Restrict or revoke affected access.
2. Rotate relevant secrets.
3. Preserve logs.
4. Identify affected users and data.
5. Patch the vulnerability.
6. Validate the fix.
7. Document the incident.
8. Notify affected stakeholders where required.

---

## 19. Security Acceptance Checklist

Before production release:

- RLS enabled and tested
- Protected routes validated server-side
- Role checks covered by tests
- Private storage configured
- Secrets absent from client bundles
- Security headers enabled
- Dependency audit completed
- Privileged actions logged
- File restrictions tested
- Error messages sanitised
- Production access restricted

---

## Changelog

- **2026-08-03/04:** Closed 2 Critical + 8 Important findings from a live security audit of the `codex/*`-authored schema: offboarding not revoking project access (C-1); the tenant boundary being writable on project updates (C-2); direct-insert bypass of project creation (I-6); four `anon`-executable workspace functions (I-1); a public storage bucket with SVG uploads enabled (I-2); a last-owner demotion gap (I-3); missing workspace/project cross-validation on files and calendar events (I-5); unvalidated task assignees (I-7); and workspace-level actions missing from audit logging (I-4). See `supabase/migrations/2026080310000{1..9}*.sql` and `supabase/migrations/README.md`. One related gap remains open and is tracked, not fixed: Phase 1's `workspace_members_write_owner_admin` policy still lets an admin `PATCH` their own row directly to `role = 'owner'`, bypassing `add_workspace_member_by_email`'s guards entirely.

---

## 20. Source of Truth

This document governs security implementation for HIVE.

Any feature that changes authentication, authorisation, file access, data handling, or privileged actions must update this specification.
