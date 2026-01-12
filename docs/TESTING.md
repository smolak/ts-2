# Testing Guidelines - LinkDeck Platform

## Table of Contents

- [Testing Guidelines - LinkDeck Platform](#testing-guidelines---linkdeck-platform)
  - [Table of Contents](#table-of-contents)
  - [Test Creation Workflow (CRITICAL)](#test-creation-workflow-critical)
  - [One File at a Time (CRITICAL)](#one-file-at-a-time-critical)
  - [Test File Organization](#test-file-organization)
    - [Grouping Tests by File, Not by `describe` Blocks](#grouping-tests-by-file-not-by-describe-blocks)
  - [Test Structure (AAA Pattern)](#test-structure-aaa-pattern)
  - [Avoid Weak Property-Existence Assertions](#avoid-weak-property-existence-assertions)
  - [Avoid Nesting](#avoid-nesting)
    - [Problems with Deep Nesting](#problems-with-deep-nesting)
  - [Avoid Mutable Variables](#avoid-mutable-variables)
  - [Inline Test Setup](#inline-test-setup)
    - [When to Inline](#when-to-inline)
    - [When to Extract](#when-to-extract)
  - [Unit Test Pattern](#unit-test-pattern)
  - [Component Test Pattern](#component-test-pattern)
  - [Hook Test Pattern](#hook-test-pattern)
  - [API Test Pattern](#api-test-pattern)
  - [Service Test Pattern](#service-test-pattern)
  - [Integration Test Pattern](#integration-test-pattern)
  - [Mocking Strategy](#mocking-strategy)
    - [Frontend - Mock External Dependencies](#frontend---mock-external-dependencies)
    - [Backend - Mock External Dependencies](#backend---mock-external-dependencies)
    - [What NOT to Mock](#what-not-to-mock)
  - [When to Use beforeEach/afterEach](#when-to-use-beforeeachaftereach)
    - [Appropriate Uses](#appropriate-uses)
    - [Why Cleanup Needs Hooks](#why-cleanup-needs-hooks)
  - [Test Execution Rules](#test-execution-rules)
    - [Running Tests](#running-tests)
  - [Import Order in Test Files](#import-order-in-test-files)

> **Reference**: This guide incorporates principles from [Kent C. Dodds' "Avoid Nesting when you're Testing"](https://kentcdodds.com/blog/avoid-nesting-when-youre-testing)

## Test Creation Workflow (CRITICAL)

**One test at a time. No exceptions.**

When creating tests, follow this strict workflow for EACH individual test case:

1. **Write ONE test case**
2. **Run the test** - verify it passes
3. **Fix any failures** - if the test fails, fix it immediately
4. **Run again** - confirm the fix works
5. **Check for warnings/linting/errors** - resolve ALL issues
6. **Repeat until clean** - the test must pass with zero warnings
7. **ONLY THEN proceed** - move to the next test case

```bash
# After writing each test:
cd apps/web
pnpm test path/to/file.test.ts

# Check for linting issues:
pnpm lint path/to/file.test.ts
```

**Why this matters:**

- Untested tests are worse than no tests (false confidence)
- Accumulated broken tests create massive debugging sessions
- Each test must be verified working before moving on
- This applies whether adding tests to the same file or a new file

**This is non-negotiable.** Never batch-create tests without running them. Never assume a test passes. Always verify.

## One File at a Time (CRITICAL)

**Even when a task requires changes to multiple files:**

1. **Modify ONE file**
2. **Run all checks** (test, lint, format, check-types)
3. **Fix any issues**
4. **Only then modify the next file**

**NEVER batch-edit multiple files before running checks.**

This applies to all file modifications - test files, source files, configuration files. No exceptions.

## Test File Organization

Tests should be placed next to the files they test (co-location pattern):

```
src/
├── utils/
│   ├── format-date.ts
│   └── format-date.test.ts
├── components/
│   ├── user-profile.tsx
│   └── user-profile.test.tsx
└── features/
    └── user-profile/
        ├── hooks/
        │   ├── use-user-profile.ts
        │   └── use-user-profile.test.ts
        └── components/
            ├── user-profile-card.tsx
            └── user-profile-card.test.tsx
```

### Grouping Tests by File, Not by `describe` Blocks

Instead of using deeply nested `describe` blocks to group tests, use separate test files:

- If there's a logical grouping of tests for the same unit, separate them into different files
- If code needs to be shared between tests, create a `__tests__/helpers/` file with shared utilities

**Benefits:**
- Logical grouping of tests
- Completely separated setup for each group
- Reduced cognitive load
- Faster parallel test execution

## Test Structure (AAA Pattern)

All tests **must follow the Arrange-Act-Assert pattern** with blank lines separating each section:

```typescript
it("should do something", () => {
  // Arrange - Set up test data and conditions
  const input = "test input";
  const expectedOutput = "expected result";

  // Act - Execute the function being tested
  const result = functionUnderTest(input);

  // Assert - Verify the results
  expect(result).toBe(expectedOutput);
});
```

**Rules:**

- **Arrange section**: Variable declarations, mock setup, test data preparation
- **Act section**: Function calls, state changes, operations being tested
- **Assert section**: Expect statements, result verification
- **Blank lines**: Must have blank lines between each section for readability
- **No comments**: Do not add `// Arrange`, `// Act`, `// Assert` comments - the blank lines make it clear

## Avoid Weak Property-Existence Assertions

**Do not write tests that only check if properties exist.** This is a common anti-pattern that provides false confidence.

**Bad:**

```typescript
it("should return deck with expected properties", async () => {
  const result = await getDeck(deckId);

  expect(result).toHaveProperty("id");
  expect(result).toHaveProperty("name");
  expect(result).toHaveProperty("slug");
  expect(result).toHaveProperty("urlsCount");
});
```

**Why this is problematic:**

1. **TypeScript already validates shape**: In a typed codebase, the return type guarantees these properties exist. This test duplicates what the compiler already enforces.
2. **`toHaveProperty` only checks existence**: The test passes even if `id` is `null`, `urlsCount` is `-999`, or `name` is an empty string. You're not verifying meaningful values.
3. **No behavior is tested**: The test doesn't verify the function correctly queries data, transforms results, or handles edge cases.
4. **Other tests implicitly cover this**: Any test that actually uses these properties (e.g., `expect(result.name).toBe("My Deck")`) would fail if the property didn't exist.

**What to do instead:**

- **Test behavior, not shape**: Write tests that verify the function does what it's supposed to do.
- **Use `toMatchObject` with actual values** if you need to verify multiple properties:

```typescript
it("should return deck with correct data", async () => {
  const deck = await createTestDeck(db, userId, "My Deck");

  const result = await getDeck(deck.id);

  expect(result).toMatchObject({
    name: "My Deck",
    slug: expect.any(String),
    urlsCount: 0,
  });
});
```

- **Trust the type system**: If the procedure returns a typed object and compiles, the shape is correct.
- **Delete the test entirely**: If the only thing being tested is "does this object have properties," the test adds no value.

## Avoid Nesting

Nesting naturally encourages using test hooks (such as `beforeEach`) as a mechanism for code reuse, which leads to unmaintainable tests.

### Problems with Deep Nesting

1. **Cognitive load**: Tracing through nested code to track variable values is difficult
2. **Variable hunting**: You have to search for where variables are defined and assigned
3. **Hidden state**: `beforeEach` blocks can reassign variables in ways that aren't obvious
4. **Maintenance burden**: The more you have to hold in your head, the less room for the important task

**Bad:**

```typescript
describe("Login", () => {
  let utils, handleSubmit, user;

  beforeEach(() => {
    handleSubmit = jest.fn();
    user = { username: "michelle", password: "smith" };
    utils = render(<Login onSubmit={handleSubmit} />);
  });

  describe("when username and password is provided", () => {
    beforeEach(() => {
      changeUsernameInput(user.username);
      changePasswordInput(user.password);
    });

    describe("when the submit button is clicked", () => {
      beforeEach(() => {
        clickSubmit();
      });

      it("should call onSubmit with the username and password", () => {
        expect(handleSubmit).toHaveBeenCalledTimes(1);
        expect(handleSubmit).toHaveBeenCalledWith(user);
      });
    });
  });
});
```

**Good:**

```typescript
test("calls onSubmit with the username and password when submit is clicked", () => {
  const handleSubmit = vi.fn();
  const { getByLabelText, getByText } = render(<Login onSubmit={handleSubmit} />);
  const user = { username: "michelle", password: "smith" };

  userEvent.type(getByLabelText(/username/i), user.username);
  userEvent.type(getByLabelText(/password/i), user.password);
  userEvent.click(getByText(/submit/i));

  expect(handleSubmit).toHaveBeenCalledTimes(1);
  expect(handleSubmit).toHaveBeenCalledWith(user);
});
```

## Avoid Mutable Variables

Mutable variables in tests (using `let` and reassigning in `beforeEach`) make tests harder to understand and maintain.

**Bad:**

```typescript
let handleSubmit, user;

beforeEach(() => {
  handleSubmit = vi.fn();
  user = { username: "michelle", password: "smith" };
});

test("whatever", () => {
  // Where does handleSubmit come from? What's its value?
  // You have to scroll up and trace through beforeEach blocks
});
```

**Good:**

```typescript
test("whatever", () => {
  const handleSubmit = vi.fn();
  const user = { username: "michelle", password: "smith" };
  // Everything is right here, no hunting required
});
```

## Inline Test Setup

For simple tests, the best solution is to remove as much abstraction as possible. Write each test as a complete, self-contained unit.

### When to Inline

- Simple tests that don't need shared utilities
- When duplicating code would make tests more readable
- When abstractions don't provide significant value

### When to Extract

- Complex setup that's repeated many times
- Helper functions that return values (not mutating shared state)
- Test utilities that improve readability

**Key principle:** Use functions for code reuse, not hooks.

```typescript
// ✅ Good: Helper function that returns a value
function renderLogin(props = {}) {
  const handleSubmit = vi.fn();
  const utils = render(<Login onSubmit={handleSubmit} {...props} />);
  return { handleSubmit, ...utils };
}

test("calls onSubmit when form is valid", () => {
  const { handleSubmit, getByLabelText, getByText } = renderLogin();

  userEvent.type(getByLabelText(/username/i), "testuser");
  userEvent.type(getByLabelText(/password/i), "password");
  userEvent.click(getByText(/submit/i));

  expect(handleSubmit).toHaveBeenCalledTimes(1);
});
```

## Unit Test Pattern

```typescript
// utils/format-date.test.ts
import { describe, it, expect } from "vitest";
import { formatDate } from "./format-date";

describe("formatDate", () => {
  it("should format date correctly", () => {
    const date = new Date("2024-01-15T10:30:00Z");

    const result = formatDate(date);

    expect(result).toBe("Jan 15, 2024");
  });

  it("should handle invalid date", () => {
    const invalidDate = new Date("invalid");

    expect(() => formatDate(invalidDate)).toThrow();
  });
});
```

## Component Test Pattern

Use dependency injection for testability:

```typescript
// components/user-profile.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { UserProfile } from "./user-profile";

// Test wrapper with dependency injection
const TestWrapper = ({ children, userService }: { children: React.ReactNode; userService: any }) => (
  <UserServiceProvider value={userService}>{children}</UserServiceProvider>
);

describe("UserProfile", () => {
  it("should render user profile", () => {
    const mockUserService = {
      getUserProfile: vi.fn().mockResolvedValue({
        id: "1",
        username: "testuser",
        email: "test@example.com",
      }),
    };

    render(
      <TestWrapper userService={mockUserService}>
        <UserProfile userId="1" />
      </TestWrapper>,
    );

    expect(screen.getByText("testuser")).toBeInTheDocument();
  });
});
```

## Hook Test Pattern

```typescript
// features/user-profile/hooks/use-user-profile.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useUserProfile } from "./use-user-profile";

describe("useUserProfile", () => {
  it("should fetch user profile", async () => {
    const mockUserService = {
      getUserProfile: vi.fn().mockResolvedValue({
        id: "1",
        username: "testuser",
      }),
    };

    const { result } = renderHook(() => useUserProfile("1"), {
      wrapper: ({ children }) => <UserServiceProvider value={mockUserService}>{children}</UserServiceProvider>,
    });

    await waitFor(() => {
      expect(result.current.data).toEqual({
        id: "1",
        username: "testuser",
      });
    });
  });
});
```

## API Test Pattern

Mock external dependencies, not business logic:

```typescript
// server/api/routers/users.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { createTestContext } from "../../test-utils";
import { usersRouter } from "./users";

describe("users router", () => {
  let testContext: TestContext;

  beforeEach(async () => {
    testContext = await createTestContext();
  });

  it("should get user profile", async () => {
    const testUser = await testContext.db
      .insert(users)
      .values({
        id: "test-user-id",
        username: "testuser",
        email: "test@example.com",
      })
      .returning();

    const caller = usersRouter.createCaller(testContext);
    const result = await caller.getProfile({ userId: "test-user-id" });

    expect(result).toMatchObject({
      id: "test-user-id",
      username: "testuser",
    });
  });
});
```

## Service Test Pattern

Mock external APIs and services:

```typescript
// services/user.service.test.ts
import { describe, it, expect, vi } from "vitest";
import { UserService } from "./user.service";

// Mock external dependencies
vi.mock("@repo/shared/lib/email", () => ({
  sendWelcomeEmail: vi.fn(),
}));

vi.mock("@repo/shared/lib/analytics", () => ({
  trackUserSignup: vi.fn(),
}));

describe("UserService", () => {
  it("should create user with profile", async () => {
    const mockDb = {
      transaction: vi.fn().mockImplementation(async (callback) => {
        return callback({
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ id: "1", username: "test" }]),
            }),
          }),
        });
      }),
    };

    const userService = new UserService(mockDb);
    const result = await userService.createUserWithProfile({
      username: "testuser",
      email: "test@example.com",
    });

    expect(result).toMatchObject({
      user: { id: "1", username: "test" },
      profile: { id: "1", username: "test" },
    });
  });
});
```

## Integration Test Pattern

```typescript
// tests/integration/user-flow.test.ts
import { describe, it, expect } from "vitest";
import { createTestApp } from "../test-utils";

describe("User Flow Integration", () => {
  it("should complete user registration flow", async () => {
    const app = await createTestApp();

    const userResponse = await app.inject({
      method: "POST",
      url: "/api/users",
      payload: {
        username: "testuser",
        email: "test@example.com",
      },
    });

    expect(userResponse.statusCode).toBe(201);
    const { id: userId } = userResponse.json();

    const profileResponse = await app.inject({
      method: "POST",
      url: "/api/profiles",
      payload: {
        userId,
        username: "testuser",
      },
    });

    expect(profileResponse.statusCode).toBe(201);

    const getProfileResponse = await app.inject({
      method: "GET",
      url: `/api/profiles/testuser`,
    });

    expect(getProfileResponse.statusCode).toBe(200);
    expect(getProfileResponse.json()).toMatchObject({
      username: "testuser",
    });
  });
});
```

## Mocking Strategy

### Frontend - Mock External Dependencies

- **Database calls**: Mock API responses, not individual functions
- **External APIs**: Mock fetch calls or API client
- **Authentication**: Mock auth context providers
- **File uploads**: Mock file upload services

### Backend - Mock External Dependencies

- **External APIs**: Mock HTTP calls to third-party services
- **Email services**: Mock email sending
- **File storage**: Mock file upload/storage services
- **Analytics**: Mock analytics tracking
- **Payment processing**: Mock payment gateways

### What NOT to Mock

- **Business logic**: Test the actual implementation
- **Database queries**: Use test database with real data
- **Internal services**: Use dependency injection instead
- **Utility functions**: Test the actual implementation

## When to Use beforeEach/afterEach

Use hooks for **cleanup and environment setup**, not for code reuse.

### Appropriate Uses

**Server lifecycle:**

```typescript
let server;

beforeAll(async () => {
  server = await startServer();
});

afterAll(() => server.close());
```

**Console mocking:**

```typescript
beforeAll(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockClear();
});

afterAll(() => {
  console.error.mockRestore();
});
```

**Database cleanup:**

```typescript
afterEach(async () => {
  await testDb.cleanup();
});
```

### Why Cleanup Needs Hooks

If cleanup code is inline within a test, a test failure would result in cleanup not running, which could cause other tests to fail. This creates cascading failures that are harder to debug.

```typescript
// ❌ Bad: Cleanup won't run if test fails
test("example", () => {
  const something = setup();
  // if this throws, cleanup never runs
  expect(something).toBe(true);
  cleanup();
});

// ✅ Good: Cleanup always runs
afterEach(() => {
  cleanup();
});

test("example", () => {
  const something = setup();
  expect(something).toBe(true);
});
```

## Test Execution Rules

**Immediate Verification Required After Every File Change:**

After modifying ANY file (in any app or package), execute these steps in order:

1. **Run lint on the entire project** (from root):
   ```bash
   pnpm lint
   # If fixable issues exist:
   pnpm lint --fix
   ```
   If lint fails: fix the issue, run lint again, verify it passes, then proceed.

2. **Run format on the entire project** (from root):
   ```bash
   pnpm format
   # If fixable issues exist:
   pnpm format --fix
   ```
   If format fails: fix the issue, run format again, verify it passes, then proceed.

3. **Run type checking on the entire project** (from root):
   ```bash
   pnpm check-types
   ```
   If type checking fails: fix the issue, run check-types again, verify it passes, then proceed.

4. **Run tests for that file** (if tests exist):
   ```bash
   cd <app-or-package-directory>  # e.g., apps/web, packages/crypto, etc.
   pnpm test path/to/file.test.ts
   ```
   If tests fail: fix the issue, run tests again, verify they pass, then proceed.

**This is mandatory.** Do not proceed to the next check until the current check passes. Do not proceed to another file until all checks pass.

### Running Tests

Tests are run from within each app or package directory, not from the root.

**Running all tests in an app, e.g. "web" app:**

```bash
cd apps/web
pnpm test
```

**Running a specific test file:**

```bash
cd apps/web
pnpm test relative/path/to/file.test.ts
```

**Examples:**

```bash
# Run all tests in the web app
cd apps/web
pnpm test

# Run a specific test file
cd apps/web
pnpm test src/features/deck/utils/format-deck.test.ts

# Run tests in a package
cd packages/crypto
pnpm test

# Run a specific test in a package
cd packages/crypto
pnpm test src/hash.test.ts
```

**Watch mode during development:**

```bash
cd apps/web
pnpm test --watch
```

**Rationale:**

- Ensures tests pass immediately after changes
- Prevents broken tests from accumulating
- Maintains code quality and confidence in changes
- Catches regressions early in the development cycle

## Import Order in Test Files

Follow the standard import rules:

```typescript
// 1. Test framework imports
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// 2. Third-party imports
import { z } from "zod";

// 3. Package imports (@repo)
import { Button } from "@repo/ui/components/button";

// 4. Relative imports (module under test)
import { UserProfile } from "./user-profile";
import { TestWrapper } from "../test-utils/test-wrapper";
```

---

**Related Documentation:**

- See `docs/ARCHITECTURE.md` for component organization and file structure that affects test placement
- See `docs/CODING-GUIDELINE.md` for general coding standards

---

**Last Updated**: January 2026
**Version**: 1.0
**Maintainer**: Development Team
