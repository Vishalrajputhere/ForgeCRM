# 402 — Design System

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen

**Document Type:** Design System

---

# 1. Purpose

This document defines the visual language of ForgeCRM.

It standardizes:

- Colors
- Typography
- Spacing
- Elevation
- Borders
- Icons
- Motion
- Component variants
- Accessibility

All UI components must follow this design system.

---

# 2. Design Principles

ForgeCRM emphasizes:

- Clarity
- Consistency
- Density
- Accessibility
- Predictability
- Simplicity

Visual design should support productivity rather than decoration.

---

# 3. Design Tokens

All visual values are represented by semantic tokens.

Examples

Colors

```
--color-primary

--color-surface

--color-background

--color-border

--color-muted

--color-danger

--color-success

--color-warning
```

Spacing

```
--space-1

--space-2

--space-3

--space-4

--space-6

--space-8
```

Radius

```
--radius-sm

--radius-md

--radius-lg
```

Shadows

```
--shadow-sm

--shadow-md

--shadow-lg
```

Components should never hardcode design values.

---

# 4. Color System

Primary

- Brand actions

Neutral

- Backgrounds
- Surfaces
- Borders
- Text

Semantic

- Success
- Warning
- Danger
- Info

Charts use an accessible palette with sufficient contrast.

---

# 5. Light & Dark Themes

Both themes are first-class citizens.

Theme switching changes tokens only.

Components never contain theme-specific logic.

---

# 6. Typography

Hierarchy

```
Display

Heading

Title

Body

Caption

Label
```

Typography establishes emphasis before color.

Avoid unnecessary font weights.

---

# 7. Spacing

Spacing follows a consistent scale.

Example

```
4

8

12

16

24

32

48

64
```

Avoid arbitrary spacing values.

---

# 8. Grid System

Use a responsive layout grid.

Recommendations

- Consistent gutters
- Predictable column widths
- Flexible content areas

The grid adapts across screen sizes.

---

# 9. Borders

Borders are subtle.

Use borders to separate information rather than decorate.

Prefer neutral border colors.

---

# 10. Elevation

Elevation indicates interaction.

Levels

```
None

Low

Medium

High
```

Avoid excessive shadows.

---

# 11. Icons

Use one icon family consistently.

Guidelines

- Decorative only when helpful
- Consistent size
- Meaningful labels for accessibility

Icons should reinforce text rather than replace it.

---

# 12. Motion

Motion communicates state changes.

Examples

- Modal open/close
- Sidebar collapse
- Toast appearance
- Drag interactions

Animations should be short and purposeful.

Avoid distracting effects.

---

# 13. Buttons

Variants

- Primary
- Secondary
- Outline
- Ghost
- Destructive
- Link

Sizes

- Small
- Medium
- Large

Loading states are required.

---

# 14. Forms

Inputs provide:

- Labels
- Helper text
- Validation
- Disabled state
- Error messages

Placeholder text should not replace labels.

---

# 15. Cards

Cards group related information.

Cards should have:

- Consistent padding
- Optional header
- Optional footer

Avoid excessive nesting.

---

# 16. Tables

Tables support:

- Sorting
- Filtering
- Pagination
- Selection
- Bulk actions

Headers remain visually distinct.

---

# 17. Feedback Components

Include standardized:

- Toasts
- Alerts
- Dialogs
- Empty states
- Skeletons
- Loading indicators

Feedback should be timely and unobtrusive.

---

# 18. Accessibility

All components must support:

- Keyboard navigation
- Focus indicators
- Screen readers
- Color contrast
- Reduced motion preferences

Accessibility is mandatory.

---

# 19. Responsiveness

Design for:

- Mobile
- Tablet
- Desktop
- Large displays

Layouts adapt without changing interaction patterns.

---

# 20. Component Consistency

Reusable components share:

- Spacing
- Typography
- Interaction
- States
- Variants

No duplicate implementations of common UI elements.

---

# 21. Future Evolution

The design system supports:

- White-label branding
- Additional themes
- New component variants
- Expanded token sets

Changes should propagate through tokens rather than individual components.

---

# 22. Summary

ForgeCRM's design system provides a consistent visual foundation built on semantic tokens, accessibility, responsive layouts, and reusable components.

By prioritizing clarity, density, and maintainability, the interface delivers a professional experience that scales as the application grows.