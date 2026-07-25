# 002 — Product Requirements Document (PRD)

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen

**Document Type:** Product Requirements

---

# 1. Purpose

This document defines every functional requirement of ForgeCRM Version 1.

It is the single source of truth for:

- Features
- Modules
- Business Rules
- User Roles
- Permissions
- Workflows
- Screens

No feature should be implemented unless it is defined in this document.

---

# 2. Product Scope

ForgeCRM is an enterprise Sales CRM designed for organizations that need to manage customers, leads, sales pipelines, tasks, documents, reports, and AI-assisted productivity.

Version 1 focuses on Sales CRM only.

---

# 3. User Roles

## Super Admin

Platform owner.

Can access every workspace.

Responsibilities:

- Manage all workspaces
- Suspend workspaces
- Manage platform settings
- View system analytics
- Audit logs

---

## Workspace Admin

Company administrator.

Responsibilities:

- Invite users
- Remove users
- Assign roles
- Manage teams
- Configure workspace
- View reports
- Full CRM access

---

## Sales Manager

Responsibilities:

- Manage sales team
- Assign leads
- View all deals
- Reports
- Approve important actions

---

## Sales Executive

Responsibilities:

- Manage assigned leads
- Create deals
- Update activities
- Manage contacts
- Manage tasks

Cannot:

- Manage users
- Change workspace settings

---

## Customer Success

Responsibilities:

- View customers
- View contacts
- Create notes
- Manage follow-ups
- Update activities

---

## Viewer

Read-only access.

Cannot modify data.

---

# 4. Core Modules

ForgeCRM Version 1 contains the following modules.

1. Authentication
2. Workspace
3. User Management
4. Dashboard
5. Leads
6. Companies
7. Contacts
8. Deals
9. Sales Pipeline
10. Tasks
11. Calendar
12. Notes
13. Documents
14. Reports
15. Notifications
16. Audit Logs
17. Settings
18. AI Assistant

---

# 5. Authentication Module

Features

- Login
- Logout
- Refresh Token
- Forgot Password
- Reset Password
- Email Verification
- Google OAuth
- Session Management

Business Rules

- Passwords are hashed.
- JWT authentication.
- Refresh token rotation.
- Expired sessions revoked.

---

# 6. Workspace Module

Features

- Company profile
- Logo
- Branding
- Currency
- Timezone
- Business hours

Business Rules

Every record belongs to exactly one workspace.

Workspace isolation is mandatory.

---

# 7. User Management

Features

- Invite user
- Deactivate user
- Change role
- Reset password
- Assign team

Business Rules

Workspace Admin cannot modify Super Admin.

---

# 8. Dashboard

Widgets

- Revenue
- Active Deals
- Lead Conversion
- Pipeline
- Tasks Due Today
- Calendar
- Recent Activities
- Sales Performance

Users can rearrange widgets.

---

# 9. Leads

Lead contains:

- Name
- Company
- Email
- Phone
- Source
- Status
- Owner
- Priority
- Tags
- Notes

Features

- Create
- Edit
- Delete (Soft Delete)
- Import CSV
- Export CSV
- Convert to Company
- Convert to Deal
- Merge Duplicates

---

# 10. Companies

Company contains:

- Name
- Industry
- Website
- Address
- Employees
- Revenue
- Owner

Relationships

Company

↓

Contacts

↓

Deals

↓

Activities

↓

Documents

---

# 11. Contacts

Fields

- Name
- Title
- Phone
- Email
- Company
- Department

Features

- Multiple contacts per company
- Timeline
- Notes
- Tasks

---

# 12. Deals

Deal contains

- Name
- Stage
- Value
- Probability
- Closing Date
- Owner

Pipeline

Lead

↓

Qualified

↓

Proposal

↓

Negotiation

↓

Won / Lost

Features

- Drag and Drop
- Forecast
- Products
- Activities

---

# 13. Tasks

Fields

- Title
- Description
- Priority
- Due Date
- Status
- Owner

Features

- Reminder
- Recurring
- Comments
- Mentions

---

# 14. Calendar

Displays

- Meetings
- Calls
- Tasks
- Deadlines

Views

- Day
- Week
- Month

---

# 15. Notes

Rich Text

Supports

- Mentions
- Attachments
- History

Notes can be attached to:

- Leads
- Companies
- Contacts
- Deals
- Tasks

---

# 16. Documents

Features

- Upload
- Preview
- Download
- Version History

Supported Files

- PDF
- DOCX
- XLSX
- PNG
- JPG

---

# 17. Reports

Available Reports

- Revenue
- Deal Forecast
- Lead Sources
- Conversion Rate
- Sales Performance
- Win/Loss Ratio

Supports

- Filters
- Export
- Date Range

---

# 18. Notifications

In-App only.

Events

- Task Assigned
- Lead Assigned
- Deal Won
- Mention
- Reminder
- Document Shared

Real-time updates using WebSockets.

---

# 19. Audit Logs

Track

- Login
- Logout
- Create
- Update
- Delete
- Role Change
- Permission Change

Audit logs cannot be modified by normal users.

---

# 20. Settings

Workspace Settings

- Branding
- Timezone
- Currency
- Language

User Settings

- Theme
- Notification Preferences
- Profile

---

# 21. AI Assistant

AI is used only to improve productivity.

Features

- Generate follow-up emails
- Summarize meeting notes
- Summarize customer history
- Natural language search
- Suggest follow-up tasks

AI never updates CRM data automatically.

Users must approve AI-generated actions.

---

# 22. Global Search

Users can search across:

- Leads
- Companies
- Contacts
- Deals
- Tasks
- Notes
- Documents

Search respects user permissions.

---

# 23. Business Rules

- Every business record belongs to one workspace.
- Soft delete is used for business data.
- UUIDs are used as primary keys.
- All timestamps stored in UTC.
- Every important action creates an activity.
- Every important action creates an audit log.
- Role permissions are enforced on every request.

---

# 24. Non-Functional Requirements

- Responsive UI
- Mobile-friendly
- Secure APIs
- Low latency
- Modular architecture
- Scalable database
- Production-ready deployment

---

# 25. Success Criteria

ForgeCRM Version 1 is complete when:

- All modules listed above are implemented.
- Multi-tenancy is enforced.
- RBAC is fully functional.
- AI productivity tools are operational.
- Reports are accurate.
- Notifications are real-time.
- The application can support multiple companies simultaneously.

---

# 26. Out of Scope

The following are intentionally excluded:

- Billing
- ERP
- Inventory
- Marketing Automation
- Live Chat
- Telephony
- Mobile App
- Marketplace
- Workflow Builder
- Public API

These may be added in future versions.

---

# 27. Requirement Freeze

This PRD is frozen for Version 1.

New features must be proposed as Version 2 requirements rather than modifying Version 1 scope.