# 408 — AI UI Patterns

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen

**Document Type:** AI User Experience Architecture

---

# 1. Purpose

This document defines how AI capabilities are presented throughout ForgeCRM.

AI should enhance existing workflows rather than interrupt them.

Users remain in control of all business decisions.

---

# 2. AI Philosophy

AI is an assistant.

Not an operator.

AI should:

- Explain
- Summarize
- Recommend
- Draft

AI should never perform business actions automatically.

---

# 3. Contextual First

AI appears where users already work.

Examples

Lead

- Summarize Lead
- Suggest Next Steps

Deal

- Analyze Deal Risk
- Draft Follow-up

Company

- Generate Company Summary

Dashboard

- Explain Metrics

Reports

- Explain Trends

The global AI assistant is secondary.

---

# 4. Global Assistant

A command-style assistant is available from anywhere.

Capabilities

- Search CRM
- Answer questions
- Find records
- Explain reports

It complements—not replaces—contextual AI.

---

# 5. AI Entry Points

AI actions should appear near relevant content.

Examples

- Toolbar actions
- Context menus
- Side panels
- Empty states
- Command palette

Avoid floating AI buttons that appear unrelated to the current task.

---

# 6. AI Panels

AI responses appear in dedicated panels.

Panels should support:

- Scrolling
- Copy
- Regenerate
- Expand
- Collapse

Panels should not replace the primary page content.

---

# 7. Streaming Responses

Long responses stream progressively.

Workflow

```
Request

↓

Streaming

↓

Completed
```

Users should receive feedback immediately after submission.

---

# 8. Response States

Supported states

```
Idle

Loading

Streaming

Completed

Failed
```

The UI clearly communicates the current state.

---

# 9. User Confirmation

Business actions require confirmation.

Examples

AI suggests

↓

User reviews

↓

User confirms

↓

Business action executes

No AI action bypasses user approval.

---

# 10. Confidence Awareness

AI responses may indicate confidence.

Examples

High confidence

- Strong recommendation

Medium confidence

- Suggested action

Low confidence

- Possible interpretation

Confidence should guide review, not replace it.

---

# 11. Citations & Context

Whenever possible, AI explains why it produced a recommendation.

Examples

- Recent activities
- Deal history
- Notes
- Metrics

Users should understand the basis for AI output.

---

# 12. Prompt History

Users may revisit previous AI requests.

History includes:

- Prompt
- Timestamp
- Related record
- Response

History improves continuity without repeating work.

---

# 13. Regeneration

Users may regenerate AI responses.

Regeneration creates a new response rather than silently replacing the previous one.

---

# 14. Feedback

Users can provide feedback.

Examples

- Helpful
- Not helpful
- Report issue

Feedback supports future prompt improvements.

---

# 15. Error Handling

Possible failures

- Timeout
- Provider unavailable
- Rate limit exceeded
- Invalid response

Provide clear recovery options.

---

# 16. Accessibility

AI features support:

- Keyboard navigation
- Screen readers
- Focus management
- Reduced motion

Streaming updates should not disrupt assistive technologies.

---

# 17. Performance

Recommendations

- Lazy-load AI panels
- Stream responses
- Cache recent responses when appropriate
- Avoid blocking page interaction

AI should never make the application feel slow.

---

# 18. Privacy

Display only information the user is authorized to access.

AI panels should clearly distinguish generated content from stored CRM data.

---

# 19. Testing

Verify:

- Streaming behavior
- Confirmation flows
- Error states
- Accessibility
- Feedback submission
- Context correctness

AI UI should be testable without requiring a live AI provider.

---

# 20. Future Extensions

Version 2 may include:

- Voice interactions
- Multi-step AI workflows
- Side-by-side comparisons
- Team prompt libraries
- Personalized AI preferences

The architecture supports these additions.

---

# 21. Summary

ForgeCRM integrates AI as a contextual productivity layer rather than a standalone destination.

By emphasizing contextual actions, streaming responses, user confirmation, confidence-aware guidance, and transparent reasoning, AI becomes a trusted assistant that improves workflows while keeping users firmly in control.