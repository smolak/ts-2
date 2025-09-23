# CODING GUIDELINE - BookmarkFlow Platform

## Table of Contents

1. [General Principles](#general-principles)
2. [Code Style & Formatting](#code-style--formatting)
3. [Naming Conventions](#naming-conventions)
4. [File Organization](#file-organization)
5. [React Component Patterns](#react-component-patterns)
6. [API Patterns (orpc)](#api-patterns-orpc)
7. [Database Patterns](#database-patterns)
8. [Error Handling](#error-handling)
9. [Testing Patterns](#testing-patterns)
10. [Performance Guidelines](#performance-guidelines)
11. [Security Guidelines](#security-guidelines)

## General Principles

### Code Quality

- **Type Safety**: Use TypeScript strictly - no `any` types
- **Immutability**: Prefer immutable data structures
- **Single Responsibility**: Each function/component should have one clear purpose
- **DRY Principle**: Don't repeat yourself, but don't over-abstract
- **KISS Principle**: Keep it simple and stupid

### Development Workflow

- **Small Commits**: Make atomic commits with clear messages
- **Feature Branches**: One feature per branch
- **Code Reviews**: All code must be reviewed before merging
- **Testing**: Write tests before or alongside code
- **Documentation**: Update docs with code changes

## Code Style & Formatting

### BiomeJS Configuration

```json
{
  "$schema": "https://biomejs.dev/schemas/2.2.4/schema.json",
  "vcs": {
    "enabled": false,
    "clientKind": "git",
    "useIgnoreFile": false
  },
  "files": {
    "ignoreUnknown": false,
    "includes": ["**/src/**/*", "**/.vscode/**/*", "**/index.html", "**/vite.config.js", "!**/src/routeTree.gen.ts"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 120
  },
  "assist": { "actions": { "source": { "organizeImports": "on" } } },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noUnknownAtRules": "off"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double"
    }
  }
}
```

### General Formatting Rules

- **Indentation**: 2 spaces (no tabs)
- **Line Length**: Max 120 characters
- **Quotes**: Double quotes for strings and JSX attributes
- **Semicolons**: Always use semicolons
- **Trailing Commas**: Use in objects and arrays
- **Blank Lines**: One blank line between functions/classes
- **Import Organization**: BiomeJS will auto-organize imports

## Naming Conventions

> **Related**: See docs/ARCHITECTURE.md for component organization patterns that affect file naming and structure.

### Files and Directories

```typescript
// Components: kebab-case for multi-word, original case for single-word
user-profile.tsx;
feed-list.tsx;
hover-card.tsx;
dropdown-menu.tsx;

// Hooks: kebab-case starting with 'use'
use-user-profile.ts;
use-feed-data.ts;

// Utilities: kebab-case
format-date.ts;
validate-url.ts;
create-possessive-form.ts;

// Types: kebab-case
user-profile.ts;
feed-item.ts;
category-name.schema.ts;

// Constants: kebab-case
api-base-url.ts;
max-categories.ts;
```

### Variables and Functions

```typescript
// Variables: camelCase
const userProfile = getUserProfile();
const isLoading = false;

// Functions: camelCase, descriptive verbs
const fetchUserData = () => {};
const validateUserInput = () => {};
const handleSubmit = () => {};

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_PAGE_SIZE = 20;

// Types/Interfaces: PascalCase
interface UserProfile {
  id: string;
  username: string;
}

type FeedItem = {
  id: string;
  title: string;
};
```

### React Components

```typescript
// Component names: PascalCase
export const UserProfile = () => {};
export const FeedList = () => {};

// Props interfaces: ComponentName + Props
interface UserProfileProps {
  userId: string;
  showActions?: boolean;
}

// Event handlers: handle + Event
const handleClick = () => {};
const handleSubmit = () => {};
const handleInputChange = () => {};
```

## File Organization

### Directory Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Basic UI components (Button, Input, etc.)
│   ├── forms/           # Form components
│   └── layout/          # Layout components
├── features/            # Feature-based organization
│   ├── user-profile/
│   │   ├── components/  # Feature-specific components
│   │   ├── hooks/       # Feature-specific hooks
│   │   ├── types/       # Feature-specific types
│   │   └── utils/       # Feature-specific utilities
├── lib/                 # Shared utilities
├── types/               # Global types
└── constants/           # Global constants
```

### Import Rules

**Single source of truth for all import patterns in the codebase.**

> **Related**: See docs/ARCHITECTURE.md for component organization patterns and file structure guidelines.

#### **Import Order (BiomeJS auto-organizes, but follow this structure):**

```typescript
// 1. React imports
import React from "react";
import { useState, useEffect } from "react";

// 2. Third-party imports
import { z } from "zod";
import { clsx } from "clsx";

// 3. Package imports (@repo)
import { Button } from "@repo/ui/components/button";
import { useUserProfile } from "@repo/user-profile/hooks/use-user-profile";
import { apiClient } from "@repo/shared/utils/api-client";

// 4. Relative imports (same feature/package)
import { UserProfileCard } from "./user-profile-card";
import { formatUserData } from "../utils/format-user-data";

// 5. Same app imports (using @/ alias)
import { FeedList } from "@/features/feed/components/feed-list";

// 6. CSS imports
import "./user-profile.css";
```

#### **Context-Specific Rules:**

**Within Same Package/Feature:**

- Use relative imports (`../`, `./`)
- Example: `import { UserProfile } from "../types/user-profile";`

**Cross-Package Imports:**

- Use `@repo/` alias
- Follow the package's specific export structure as defined in its package.json exports field
- For catch-all exports (`"./*": "./src/*.ts"`): Use the full path
  - Example: `import { generateUrlId } from "@repo/url/id/generate-url-id";`
- For specific exports: Use the defined export keys
  - Example: `import { Button } from "@repo/ui/components/button";`

**App to Package Imports:**

- Use `@repo/` alias
- Example: `import { UserProfileCard } from "@repo/user-profile/components/user-profile-card";`

**Within Same App:**

- Use `@/` alias for cleaner imports
- Example: `import { FeedList } from "@/features/feed/components/feed-list";`

#### **Forbidden Patterns:**

- ❌ App importing from another app
- ❌ Package importing from app
- ❌ Using relative imports within same app (use `@/` alias instead)

#### **Examples by File Type:**

**Component Files:**

```typescript
import React from "react";
import { z } from "zod";
import { Button } from "@repo/ui/components/button";
import { useUserProfile } from "@repo/user-profile/hooks/use-user-profile";
import { FeedList } from "@/features/feed/components/feed-list";
import "./component.css";
```

**Hook Files:**

```typescript
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@repo/shared/utils/api-client";
import { UserProfile } from "../types/user-profile";
```

**API Router Files:**

```typescript
import { createRouter, publicProcedure } from "@repo/shared/lib/orpc";
import { z } from "zod";
import { getUserProfile } from "../services/user-service";
```

**Test Files:**

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserProfile } from "./user-profile";
import { TestWrapper } from "../test-utils/test-wrapper";
```

**Service Files:**

```typescript
import { logger } from "@repo/shared/utils/logger";
import { sendEmail } from "@repo/shared/lib/email";
import { UserProfile } from "../types/user-profile";
```

**Utility Files:**

```typescript
import { z } from "zod";
import { format } from "date-fns";
import { AppError } from "@repo/shared/utils/errors";
```

#### **Package Structure Reference:**

**Shared Packages (`@repo/`):**

- `@repo/ui` - UI components
- `@repo/shared` - Shared utilities and types
- `@repo/user-profile` - User profile features
- `@repo/categories` - Category management
- `@repo/urls` - URL management
- `@repo/metadata` - Metadata extraction
- `@repo/feed` - Feed functionality

**Package Export Strategy:**

- **Export only what other packages need to use** - not every file needs to be exported
- **Internal files** (like `env.ts`, `schema.ts` in db package) can remain unexported if they're only used internally
- **Add exports as needed** - when other packages require access to additional functionality
- **Follow the principle of least exposure** - expose only the public API that other packages depend on

**App Structure:**

- `apps/web/` - Web application
- `apps/browser-extension/` - Browser extension

#### **Import Path Examples:**

**From Web App to Package:**

```typescript
// apps/web/features/feed/components/feed-item.tsx
import { UserProfileCard } from "@repo/user-profile/components/user-profile-card";
import { CategoryBadge } from "@repo/categories/components/category-badge";
```

**From Package to Package:**

```typescript
// packages/user-profile/components/user-profile-card.tsx
import { Button } from "@repo/ui/components/button";
import { apiClient } from "@repo/shared/utils/api-client";
```

**Within Same Package:**

```typescript
// packages/user-profile/hooks/use-user-profile.ts
import { UserProfile } from "../types/user-profile";
import { useQuery } from "@tanstack/react-query";
```

**Within Same App:**

```typescript
// apps/web/features/feed/components/feed-list.tsx
import { FeedItem } from "./feed-item";
import { FeedFilters } from "./feed-filters";
import { AppLayout } from "../../layout/components/app-layout";
```

#### **Migration Guide:**

**From `@/` to Relative Paths:**

```typescript
// ❌ Old
import { Button } from "@/components/ui/Button";
import { useUser } from "@/hooks/useUser";

// ✅ New
import { Button } from "@repo/ui/components/button";
import { useUser } from "../hooks/use-user";
```

**From `@workspace` to `@repo`:**

```typescript
// ❌ Old
import { Button } from "@repo/ui/components/Button";

// ✅ New
import { Button } from "@repo/ui/components/button";
```

#### **Quick Reference Table:**

| Context        | Import Type | Example                                                               |
| -------------- | ----------- | --------------------------------------------------------------------- |
| Same package   | Relative    | `import { User } from "../types/user";`                               |
| Cross-package  | `@repo/`    | `import { Button } from "@repo/ui/components/button";`<br>`import { generateUrlId } from "@repo/url/id/generate-url-id";` |
| App to package | `@repo/`    | `import { UserCard } from "@repo/user-profile/components/user-card";`  |
| Same app       | `@/` alias  | `import { FeedList } from "@/features/feed/components/feed-list";` |
| CSS files      | Relative    | `import "./component.css";`                                           |

## React Component Patterns

### Component Structure

```typescript
// 1. Imports (follow Import Rules section)
import React from 'react';
import { z } from 'zod';

// 2. Types/Interfaces
interface UserProfileProps {
  userId: string;
  showActions?: boolean;
}

// 3. Component
export const UserProfile: React.FC<UserProfileProps> = ({
  userId,
  showActions = true,
}) => {
  // 4. Hooks
  const { data: user, isLoading } = useUserProfile(userId);

  // 5. Event handlers
  const handleEdit = () => {};

  // 6. Render
  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="user-profile">
      {/* JSX */}
    </div>
  );
};
```

### Custom Hooks Pattern

```typescript
// hooks/use-user-profile.ts
export const useUserProfile = (userId: string) => {
  const [data, setData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const user = await getUserProfile(userId);
        setData(user);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  return { data, isLoading, error };
};
```

### Form Handling Pattern

```typescript
// Follow Import Rules section for import order
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
});

type FormData = z.infer<typeof schema>;

export const UserForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    // Handle form submission
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
};
```

## API Patterns (orpc)

### Router Structure

```typescript
// routers/users.ts
// Follow Import Rules section for import order
import { createRouter, publicProcedure, protectedProcedure } from "@repo/shared/lib/orpc";
import { z } from "zod";

export const usersRouter = createRouter({
  getProfile: publicProcedure.input(z.object({ userId: z.string() })).query(async ({ input, ctx }) => {
    return await getUserProfile(input.userId);
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        username: z.string().min(3).max(20),
        imageUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return await updateUserProfile(ctx.user.id, input);
    }),
});
```

### Error Handling

```typescript
// shared/utils/errors.ts
// Follow Import Rules section for import order
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const handleApiError = (error: unknown) => {
  if (error instanceof AppError) {
    return { message: error.message, code: error.code };
  }

  console.error("Unexpected error:", error);
  return { message: "Internal server error", code: "INTERNAL_ERROR" };
};
```

### Input Validation

```typescript
// schemas/user.ts
import { z } from "zod";

export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be less than 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email address"),
  imageUrl: z.string().url("Invalid image URL").optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
```

## Database Patterns

### Query Patterns

```typescript
// queries/user.ts
export const getUserProfile = async (userId: string) => {
  const user = await db.query.userProfiles.findFirst({
    where: (userProfiles, { eq }) => eq(userProfiles.userId, userId),
    with: {
      user: true,
    },
  });

  if (!user) {
    throw new AppError("User not found", "USER_NOT_FOUND", 404);
  }

  return user;
};
```

### Transaction Patterns

```typescript
// services/user.ts
export const createUserWithProfile = async (userData: CreateUserInput) => {
  return await db.transaction(async (tx) => {
    // Create user
    const [user] = await tx
      .insert(users)
      .values({
        id: generateUserId(),
        ...userData,
      })
      .returning();

    // Create profile
    const [profile] = await tx
      .insert(userProfiles)
      .values({
        userId: user.id,
        username: userData.username,
      })
      .returning();

    return { user, profile };
  });
};
```

## Error Handling

### Client-Side Error Handling

```typescript
// hooks/use-error-handler.ts
export const useErrorHandler = () => {
  const [error, setError] = useState<Error | null>(null);

  const handleError = (error: Error) => {
    console.error("Error:", error);
    setError(error);

    // Show toast notification
    toast.error(error.message);
  };

  const clearError = () => setError(null);

  return { error, handleError, clearError };
};
```

### API Error Handling

```typescript
// shared/utils/api-client.ts
// Follow Import Rules section for import order
export const apiClient = {
  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(endpoint, {
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new AppError(error.message, error.code, response.status);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Network error", "NETWORK_ERROR", 500);
    }
  },
};
```

## Testing Patterns

> **Related**: See docs/ARCHITECTURE.md for component organization and file structure that affects test placement.

### Test File Organization

Tests should be placed next to the files they test:

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

### Unit Test Pattern

```typescript
// utils/format-date.test.ts
// Follow Import Rules section for import order
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

#### Test Structure (AAA Pattern)

All tests must follow the **Arrange-Act-Assert** pattern with blank lines separating each section:

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

### Component Test Pattern (Dependency Injection)

```typescript
// components/user-profile.test.tsx
// Follow Import Rules section for import order
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { UserProfile } from "./user-profile";

// Test wrapper with dependency injection
const TestWrapper = ({ children, userService }: { children: React.ReactNode; userService: any }) => (
  <UserServiceProvider value={userService}>
    {children}
  </UserServiceProvider>
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
      </TestWrapper>
    );

    expect(screen.getByText("testuser")).toBeInTheDocument();
  });
});
```

### Hook Test Pattern (Dependency Injection)

```typescript
// features/user-profile/hooks/use-user-profile.test.ts
// Follow Import Rules section for import order
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
      wrapper: ({ children }) => (
        <UserServiceProvider value={mockUserService}>
          {children}
        </UserServiceProvider>
      ),
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

### API Test Pattern (Backend - Mock External Dependencies)

```typescript
// routers/users.test.ts
// Follow Import Rules section for import order
import { describe, it, expect, beforeEach } from "vitest";
import { createTestContext } from "../test-utils";
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

### Service Test Pattern (Backend - Mock External APIs)

```typescript
// services/user.service.test.ts
// Follow Import Rules section for import order
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

### Integration Test Pattern (Full Stack)

```typescript
// tests/integration/user-flow.test.ts
// Follow Import Rules section for import order
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

### Mocking Strategy

#### Frontend - Mock External Dependencies

- **Database calls**: Mock API responses, not individual functions
- **External APIs**: Mock fetch calls or API client
- **Authentication**: Mock auth context providers
- **File uploads**: Mock file upload services

#### Backend - Mock External Dependencies

- **External APIs**: Mock HTTP calls to third-party services
- **Email services**: Mock email sending
- **File storage**: Mock file upload/storage services
- **Analytics**: Mock analytics tracking
- **Payment processing**: Mock payment gateways

#### What NOT to Mock

- **Business logic**: Test the actual implementation
- **Database queries**: Use test database with real data
- **Internal services**: Use dependency injection instead
- **Utility functions**: Test the actual implementation

### Test Execution Rules

**Immediate Test Execution Required:**

- **When a test file is changed**: Run the specific test file immediately after making changes
- **When a source file is changed**: Run all related test files immediately after making changes

**Implementation:**
- Use your IDE's test runner or terminal to run tests immediately after changes
- For test files: `pnpm test path/to/test-file.test.ts`
- For source files: Run all tests that import or test the changed file
- Use watch mode during development: `pnpm test --watch`

**Rationale:**
- Ensures tests pass immediately after changes
- Prevents broken tests from accumulating
- Maintains code quality and confidence in changes
- Catches regressions early in the development cycle

## Performance Guidelines

### React Performance

```typescript
// Use React.memo for expensive components
export const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* Expensive rendering */}</div>;
});

// Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// Use useCallback for event handlers passed to children
const handleClick = useCallback(() => {
  // Handle click
}, [dependency]);
```

### Database Performance

```typescript
// Use proper indexing
export const getUserFeeds = async (userId: string, limit: number) => {
  return await db.query.feeds.findMany({
    where: (feeds, { eq }) => eq(feeds.userId, userId),
    orderBy: (feeds, { desc }) => desc(feeds.createdAt),
    limit,
    // Include related data efficiently
    with: {
      userUrl: {
        with: {
          url: true,
        },
      },
    },
  });
};
```

## Security Guidelines

### Input Validation

```typescript
// Always validate input
const createUser = async (input: unknown) => {
  const validatedInput = createUserSchema.parse(input);
  // Process validated input
};
```

### SQL Injection Prevention

```typescript
// Use parameterized queries (Drizzle ORM handles this)
const user = await db.query.users.findFirst({
  where: (users, { eq }) => eq(users.id, userId), // Safe
});
```

### Authentication Checks

```typescript
// Always check authentication in protected routes
export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new AppError("Unauthorized", "UNAUTHORIZED", 401);
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
```

---

## Code Review Checklist

### Before Submitting

- [ ] Code follows naming conventions
- [ ] All functions have proper TypeScript types
- [ ] Error handling is implemented
- [ ] Tests are written and passing
- [ ] Code is formatted with BiomeJS
- [ ] No console.log statements in production code
- [ ] Performance considerations addressed
- [ ] Security best practices followed

### Review Focus Areas

- [ ] Code readability and maintainability
- [ ] Proper error handling
- [ ] Type safety
- [ ] Performance implications
- [ ] Security considerations
- [ ] Test coverage
- [ ] Documentation updates

This coding guideline ensures consistency, maintainability, and quality across the BookmarkFlow platform development.
