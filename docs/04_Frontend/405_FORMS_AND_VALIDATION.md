# 405 — Forms & Validation

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen

**Document Type:** Forms & Validation Architecture

---

# 1. Purpose

This document defines how forms are designed, validated, submitted, and managed throughout ForgeCRM.

Goals:

- Type safety
- Accessibility
- Consistency
- Reusability
- Predictable behavior

---

# 2. Philosophy

Forms are business workflows.

They should be:

- Easy to complete
- Difficult to misuse
- Fast
- Accessible
- Consistent

Validation should guide users rather than punish them.

---

# 3. Technology

Forms

- React Hook Form

Validation

- Zod

Types

- TypeScript

Schema validation is the single source of truth.

---

# 4. Schema-First Design

Every form begins with one Zod schema.

```
Zod Schema

↓

TypeScript Type

↓

React Hook Form

↓

API Payload
```

Never duplicate validation logic.

---

# 5. Form Lifecycle

Typical flow

```
Idle

↓

Editing

↓

Validating

↓

Submitting

↓

Success / Error
```

The UI should clearly reflect the current state.

---

# 6. Form Structure

A feature owns its forms.

Example

```
features/

    leads/

        forms/

            LeadForm

            LeadFields

            LeadSchema
```

Avoid placing feature-specific forms in shared directories.

---

# 7. Reusable Field Components

Provide shared primitives for:

- Text input
- Textarea
- Select
- Combobox
- Checkbox
- Radio group
- Switch
- Date picker
- File upload

These components should integrate directly with React Hook Form.

---

# 8. Validation

Validation occurs:

- On submit
- On change (where appropriate)
- On blur (where appropriate)

Avoid overwhelming users with immediate error messages while typing.

---

# 9. Error Messages

Errors should be:

- Specific
- Actionable
- Human-readable

Example

Good

```
Email address is required.
```

Better than

```
Invalid input.
```

---

# 10. Server Validation

Client validation improves UX.

Server validation remains authoritative.

Server errors should map cleanly back to form fields when possible.

---

# 11. Submission Flow

```
Validate

↓

Submit

↓

Disable Submit Button

↓

Await Response

↓

Show Result
```

Prevent duplicate submissions.

---

# 12. Loading States

During submission:

- Disable primary actions
- Show loading indicators
- Preserve entered values

Avoid clearing forms until success is confirmed.

---

# 13. Dirty State

Track whether a form has unsaved changes.

Examples

- Warn before leaving the page
- Enable Save button only when needed
- Prevent accidental data loss

---

# 14. Reset Behavior

Successful submission may:

- Reset the form
- Keep values
- Redirect

Behavior depends on the workflow.

---

# 15. Autosave

Autosave is optional and feature-specific.

Suitable for:

- Notes
- Drafts
- Long-form text

Not recommended for destructive actions or multi-step workflows.

---

# 16. File Uploads

Uploads should:

- Validate size
- Validate file type
- Show progress
- Support retry where appropriate

Use the storage architecture defined in backend documentation.

---

# 17. Accessibility

Every field requires:

- Visible label
- Keyboard support
- Focus styles
- Error association
- Helper text when needed

Placeholder text must not replace labels.

---

# 18. Multi-Step Forms

Large workflows may use steps.

Examples

- Workspace creation
- Import wizard
- Onboarding

Each step validates independently.

---

# 19. Optimistic UX

Only use optimistic behavior when failures are easily reversible.

Examples

- Saving preferences
- Updating profile settings

Critical business operations should wait for server confirmation.

---

# 20. Testing

Verify:

- Validation rules
- Error rendering
- Submission flow
- Dirty-state behavior
- Accessibility
- Server error mapping

Forms should be testable in isolation.

---

# 21. Future Extensions

Version 2 may include:

- Collaborative editing
- Draft recovery
- Offline form submission
- Dynamic schema generation
- Conditional field rendering

The architecture supports these enhancements.

---

# 22. Summary

ForgeCRM adopts a schema-first form architecture built on React Hook Form, Zod, and TypeScript.

By treating forms as structured workflows with a single validation source, reusable field components, accessible interactions, and predictable state transitions, the application delivers reliable and maintainable user experiences across every module.