# 702 — Unit Testing

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen

**Document Type:** Unit Testing Guidelines

---

# 1. Purpose

This document defines the unit testing standards for ForgeCRM.

The objective is to verify individual units of code in isolation while providing fast feedback during development.

Unit tests form the foundation of the automated testing strategy.

---

# 2. Unit Testing Principles

ForgeCRM unit tests should be:

- Fast
- Deterministic
- Isolated
- Repeatable
- Easy to understand
- Easy to maintain

Tests should validate observable behavior rather than implementation details.

---

# 3. Scope

Unit tests cover individual units such as:

- Functions
- Classes
- Services
- Utilities
- Validators
- Domain logic

External systems are excluded.

---

# 4. Isolation

Unit tests should not depend on:

- Databases
- Networks
- File systems
- External APIs
- Real email services
- Object storage

Dependencies should be replaced with test doubles where appropriate.

---

# 5. Mocking Strategy

Use mocks or fakes only for external dependencies.

Examples:

- Database repositories
- Email providers
- AI providers
- Object storage
- HTTP clients

Avoid excessive mocking of internal business logic.

---

# 6. Test Structure

Tests should follow the Arrange–Act–Assert pattern.

```
Arrange

↓

Act

↓

Assert
```

Each section should have a clear purpose.

---

# 7. Naming Conventions

Test names should clearly describe behavior.

Examples:

- creates_workspace_successfully
- rejects_invalid_email
- calculates_total_discount
- returns_404_when_contact_missing

Names should describe expected outcomes.

---

# 8. Assertions

Assertions should verify:

- Return values
- State changes
- Exceptions
- Validation results

Avoid multiple unrelated assertions in a single test.

---

# 9. Fixtures

Fixtures should:

- Be reusable
- Be deterministic
- Minimize duplication
- Represent realistic data

Keep fixtures simple and focused.

---

# 10. Edge Cases

Unit tests should include:

- Empty input
- Null values
- Boundary values
- Invalid formats
- Maximum limits
- Minimum limits

Edge cases are first-class test scenarios.

---

# 11. Error Handling

Verify expected behavior for:

- Validation failures
- Business rule violations
- Invalid state transitions
- Unexpected inputs

Failure paths are as important as success paths.

---

# 12. Test Independence

Each test must:

- Run independently
- Avoid shared mutable state
- Produce identical results regardless of execution order

Tests should support parallel execution.

---

# 13. Performance

Unit tests should execute quickly.

The complete unit test suite should be suitable for frequent execution during development and in CI.

Slow tests should be investigated and optimized.

---

# 14. Coverage

Prioritize testing:

- Business rules
- Domain services
- Validation logic
- Critical calculations

Coverage should emphasize risk rather than quantity.

---

# 15. Anti-Patterns

Avoid:

- Network calls
- Real database access
- Time-dependent behavior without control
- Randomized outcomes
- Long setup code
- Brittle implementation-specific assertions

Tests should remain stable over time.

---

# 16. CI Integration

Unit tests execute:

- Before merge
- During pull requests
- During release validation

Failing unit tests block further pipeline stages.

---

# 17. Future Enhancements

Future improvements may include:

- Mutation testing
- Property-based testing
- Snapshot testing (where appropriate)
- Test impact analysis

Enhancements should improve confidence without increasing unnecessary complexity.

---

# 18. Summary

ForgeCRM unit tests validate isolated business behavior using fast, deterministic, and maintainable test cases.

By emphasizing behavior over implementation, minimizing external dependencies, and covering both success and failure scenarios, the unit test suite provides rapid feedback and a reliable foundation for higher levels of testing.