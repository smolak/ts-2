# ARCHITECTURE Document - LinkDeck Platform

## Table of Contents

1. [System Overview](#system-overview)
2. [Component Architecture](#component-architecture)
3. [Data Flow](#data-flow)
4. [Integration Points](#integration-points)
5. [Dependency Management](#dependency-management)
6. [Scalability Considerations](#scalability-considerations)
7. [Performance Architecture](#performance-architecture)
8. [Security Architecture](#security-architecture)
9. [Deployment Architecture](#deployment-architecture)
10. [Monitoring & Observability](#monitoring--observability)

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                             │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Web App       │   Browser       │   Mobile App (Future)       │
│   (Next.js)     │   Extension     │                             │
└─────────────────┴─────────────────┴─────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway                              │
│                        (tRPC Router)                            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                       │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   User Service  │   Feed Service  │   URL Service               │
│   Tag Svc       │   Follow Svc    │   Metadata Svc              │
└─────────────────┴─────────────────┴─────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Access Layer                          │
│                      (Drizzle ORM)                              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Data Layer                               │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   PostgreSQL    │   Clerk Auth    │   File Storage              │
│   (Primary DB)  │   (Auth)        │   (Cloudinary/S3)           │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

### Technology Stack Details

- **Frontend**: Next.js (React 19, TypeScript)
- **Backend**: tRPC (Type-safe RPC)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Clerk
- **File Storage**: Cloudinary or AWS S3
- **Caching**: Redis (future)
- **Monitoring**: Sentry + custom metrics

## Component Architecture

> **Related**: See docs/CODING-GUIDELINE.md for import rules, naming conventions, and testing patterns that apply to components.

### Frontend Components

#### Shared UI Components

```
packages/ui/
├── components/           # Basic UI primitives
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   ├── LoadingSpinner.tsx
│   ├── Card.tsx
│   └── Badge.tsx
├── forms/               # Reusable form components
│   ├── FormField.tsx
│   ├── FormLabel.tsx
│   └── FormError.tsx
└── layout/              # Layout primitives
    ├── Container.tsx
    ├── Grid.tsx
    └── Flex.tsx
```

#### Shared Features (Packages)

```
packages/
├── user-profile/           # Shared user profile logic
│   ├── components/
│   │   ├── UserProfileCard.tsx
│   │   ├── UserStats.tsx
│   │   └── UserAvatar.tsx
│   ├── hooks/
│   │   ├── useUserProfile.ts
│   │   └── useUserStats.ts
│   ├── types/
│   │   └── UserProfile.ts
│   ├── utils/
│   │   └── formatUserData.ts
│   └── schemas/
│       └── userProfile.schema.ts
├── tags/                   # Shared tag logic
│   ├── components/
│   │   ├── TagBadge.tsx
│   │   └── TagPicker.tsx
│   ├── hooks/
│   │   └── useTags.ts
│   ├── types/
│   │   └── Tag.ts
│   └── schemas/
│       └── tag.schema.ts
├── urls/                   # Shared URL logic
│   ├── components/
│   │   ├── UrlCard.tsx
│   │   ├── UrlMetadata.tsx
│   │   └── UrlActions.tsx
│   ├── hooks/
│   │   └── useUrl.ts
│   ├── types/
│   │   └── Url.ts
│   └── schemas/
│       └── url.schema.ts
└── metadata/               # Shared metadata logic
    ├── components/
    │   └── MetadataPreview.tsx
    ├── hooks/
    │   └── useMetadata.ts
    ├── types/
    │   └── Metadata.ts
    └── utils/
        └── extractMetadata.ts
```

#### App-Specific Features

```
apps/
├── web/
│   ├── app/                # Next.js App Router
│   └── features/
│       ├── feed/           # Web-specific feed features
│       │   ├── components/
│       │   │   ├── FeedList.tsx
│       │   │   ├── FeedItem.tsx
│       │   │   ├── InfiniteFeed.tsx
│       │   │   └── FeedFilters.tsx
│       │   └── hooks/
│       │       └── useInfiniteFeed.ts
│       ├── layout/         # Web-specific layout
│       │   ├── components/
│       │   │   ├── AppHeader.tsx
│       │   │   ├── AppSidebar.tsx
│       │   │   ├── AppFooter.tsx
│       │   │   └── AppLayout.tsx
│       │   └── hooks/
│       │       └── useLayout.ts
│       └── user-profile/   # Web-specific user profile features
│           ├── components/
│           │   └── UserProfileForm.tsx  # Web-specific form
│           └── hooks/
│               └── useUserProfileForm.ts
└── browser-extension/
    └── features/
        ├── url-sharing/    # Extension-specific URL sharing
        │   ├── components/
        │   │   ├── UrlSharingForm.tsx
        │   │   └── TagSelector.tsx
        │   └── hooks/
        │       └── useUrlSharing.ts
        └── settings/       # Extension-specific settings
            ├── components/
            │   └── SettingsForm.tsx
            └── hooks/
                └── useSettings.ts
```

#### Shared Feature Strategy

**Package Organization:**

- **Shared Logic**: Business logic, types, schemas, and utilities in `packages/`
- **App-Specific UI**: Platform-specific components in `apps/*/features/`
- **Cross-Platform Components**: Reusable UI components in shared packages

**Usage Patterns:**

```typescript
// Web app using shared packages
// apps/web/features/feed/components/FeedItem.tsx
// Follow import rules from CODING-GUIDELINE.md
import { UrlCard } from "@repo/urls/components/UrlCard";
import { TagBadge } from "@repo/tags/components/TagBadge";
import { UserAvatar } from "@repo/user-profile/components/UserAvatar";

export const FeedItem = ({ item }) => {
  return (
    <div className="feed-item">
      <UserAvatar user={item.user} />
      <UrlCard url={item.url} />
      <TagBadge tag={item.tag} />
    </div>
  );
};

// Browser extension using shared packages
// apps/browser-extension/features/url-sharing/components/UrlSharingForm.tsx
// Follow import rules from CODING-GUIDELINE.md
import { TagPicker } from "@repo/tags/components/TagPicker";
import { MetadataPreview } from "@repo/metadata/components/MetadataPreview";
import { useUrl } from "@repo/urls/hooks/useUrl";

export const UrlSharingForm = () => {
  const { saveUrl } = useUrl();

  return (
    <form>
      <MetadataPreview />
      <TagPicker />
      <button onClick={saveUrl}>Save URL</button>
    </form>
  );
};
```

**Package Dependencies:**

```json
// packages/user-profile/package.json
{
  "name": "@repo/user-profile",
  "exports": {
    "./components": "./src/components/index.ts",
    "./hooks": "./src/hooks/index.ts",
    "./types": "./src/types/index.ts",
    "./schemas": "./src/schemas/index.ts"
  },
  "dependencies": {
    "@repo/ui": "workspace:*",
    "react": "^19.0.0"
  }
}
```

#### Component Composition Strategy

**Feature-Based Organization Benefits:**

- **Co-location**: Components, hooks, and types are grouped by feature
- **Encapsulation**: Each feature manages its own UI components
- **Reusability**: Shared UI components in `packages/ui/` for cross-feature use
- **Cross-Platform**: Shared business logic in packages, app-specific UI in features
- **Maintainability**: Easier to find and modify feature-specific components

**Composition Pattern:**

```typescript
// App-level composition
// apps/web/app/dashboard/page.tsx
// Follow import rules from CODING-GUIDELINE.md
import { AppLayout } from "@/features/layout/components/AppLayout";
import { FeedList } from "@/features/feed/components/FeedList";
import { TagSidebar } from "@/features/tags/components/TagSidebar";

export default function DashboardPage() {
  return (
    <AppLayout
      sidebar={<TagSidebar />}
      main={<FeedList />}
    />
  );
}

// Feature-level composition
// features/feed/components/FeedList.tsx
// Follow import rules from CODING-GUIDELINE.md
import { Card } from "@repo/ui/components/Card";
import { FeedItem } from "./FeedItem";
import { FeedFilters } from "./FeedFilters";

export const FeedList = () => {
  return (
    <div className="feed-list">
      <FeedFilters />
      {feedItems.map(item => (
        <Card key={item.id}>
          <FeedItem item={item} />
        </Card>
      ))}
    </div>
  );
};
```

#### Avoiding Cyclic Dependencies

**Dependency Rules:**

- **Packages → Apps**: Packages can be used by apps, but apps cannot depend on each other
- **Shared → Specific**: Shared packages can depend on other shared packages, but not on app-specific code
- **No Circular Imports**: Within the same package, avoid circular imports between modules

**Dependency Graph:**

```
packages/ui/ (no dependencies on other packages)
    ↑
packages/shared/ (depends on ui)
    ↑
packages/user-profile/ (depends on ui, shared)
    ↑
apps/web/ (depends on all packages)
apps/browser-extension/ (depends on all packages)
```

**Import Rules:**

- **📋 See [CODING-GUIDELINE.md](./CODING-GUIDELINE.md#import-rules) for complete import patterns and examples**
- **Related**: See docs/CODING-GUIDELINE.md for detailed import rules and examples

#### CRUD Hooks Organization

**Single File for CRUD Operations:**
All CRUD operations for an entity should be in one file to centralize cache management and ensure consistency.

**File Naming Convention:**

- **File Name**: Use feature name without "use" prefix (e.g., `userProfile.ts`, `tags.ts`)
- **Individual Hooks**: Each hook still uses "use" prefix (e.g., `useUserProfile`, `useCreateUserProfile`)
- **Purpose**: The file contains multiple hooks but is not a hook itself

```typescript
// packages/user-profile/hooks/userProfile.ts
// Follow import rules from CODING-GUIDELINE.md
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@repo/shared/utils/apiClient";
import { UserProfile } from "../types/UserProfile";

const QUERY_KEYS = {
  userProfile: (id: string) => ["userProfile", id] as const,
  userProfiles: () => ["userProfiles"] as const,
};

// READ operations
export const useUserProfile = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.userProfile(id),
    queryFn: () => apiClient.get<UserProfile>(`/api/user-profiles/${id}`),
    enabled: !!id,
  });
};

export const useUserProfiles = () => {
  return useQuery({
    queryKey: QUERY_KEYS.userProfiles(),
    queryFn: () => apiClient.get<UserProfile[]>("/api/user-profiles"),
  });
};

// CREATE operation
export const useCreateUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserProfileInput) => apiClient.post<UserProfile>("/api/user-profiles", data),
    onSuccess: (newProfile) => {
      // Update the list cache
      queryClient.setQueryData(QUERY_KEYS.userProfiles(), (old: UserProfile[] = []) => [...old, newProfile]);
      // Add individual profile to cache
      queryClient.setQueryData(QUERY_KEYS.userProfile(newProfile.id), newProfile);
    },
  });
};

// UPDATE operation
export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserProfileInput }) =>
      apiClient.put<UserProfile>(`/api/user-profiles/${id}`, data),
    onSuccess: (updatedProfile) => {
      // Update individual profile cache
      queryClient.setQueryData(QUERY_KEYS.userProfile(updatedProfile.id), updatedProfile);
      // Update list cache
      queryClient.setQueryData(QUERY_KEYS.userProfiles(), (old: UserProfile[] = []) =>
        old.map((profile) => (profile.id === updatedProfile.id ? updatedProfile : profile)),
      );
    },
  });
};

// DELETE operation
export const useDeleteUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/user-profiles/${id}`),
    onSuccess: (_, deletedId) => {
      // Remove from individual cache
      queryClient.removeQueries({ queryKey: QUERY_KEYS.userProfile(deletedId) });
      // Update list cache
      queryClient.setQueryData(QUERY_KEYS.userProfiles(), (old: UserProfile[] = []) =>
        old.filter((profile) => profile.id !== deletedId),
      );
    },
  });
};

// Utility hook for optimistic updates
export const useUserProfileOptimisticUpdate = () => {
  const queryClient = useQueryClient();

  const optimisticUpdate = (id: string, data: Partial<UserProfile>) => {
    queryClient.setQueryData(QUERY_KEYS.userProfile(id), (old: UserProfile | undefined) =>
      old ? { ...old, ...data } : undefined,
    );
  };

  const revertOptimisticUpdate = (id: string) => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userProfile(id) });
  };

  return { optimisticUpdate, revertOptimisticUpdate };
};
```

**Usage in Components:**

```typescript
// features/user-profile/components/UserProfileForm.tsx
// Follow import rules from CODING-GUIDELINE.md
import { useUserProfile, useUpdateUserProfile } from "@repo/user-profile/hooks/userProfile";

export const UserProfileForm = ({ userId }: { userId: string }) => {
  const { data: userProfile, isLoading } = useUserProfile(userId);
  const updateProfile = useUpdateUserProfile();

  const handleSubmit = (data: UpdateUserProfileInput) => {
    updateProfile.mutate({ id: userId, data });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
};
```

**Other Examples:**

```typescript
// packages/tags/hooks/tags.ts
export const useTags = () => {
  /* ... */
};
export const useCreateTag = () => {
  /* ... */
};
export const useUpdateTag = () => {
  /* ... */
};
export const useDeleteTag = () => {
  /* ... */
};

// packages/urls/hooks/urls.ts
export const useUrls = () => {
  /* ... */
};
export const useCreateUrl = () => {
  /* ... */
};
export const useUpdateUrl = () => {
  /* ... */
};
export const useDeleteUrl = () => {
  /* ... */
};

// packages/feeds/hooks/feeds.ts
export const useFeeds = () => {
  /* ... */
};
export const useInfiniteFeeds = () => {
  /* ... */
};
export const useLikeUrl = () => {
  /* ... */
};
export const useUnlikeUrl = () => {
  /* ... */
};
```

**Shared vs Feature Components:**

- **Shared UI** (`packages/ui/`): Basic primitives used across features
- **Feature Components** (`features/*/components/`): Business logic components
- **Layout Components** (`features/layout/`): App-wide layout and navigation

### Backend Architecture

#### API Layer (tRPC)

```
server/
├── api/
│   ├── routers/
│   │   ├── users.ts          # User management
│   │   ├── profiles.ts       # User profiles
│   │   ├── feeds.ts          # Feed operations
│   │   ├── tags.ts           # Tag management
│   │   ├── urls.ts           # URL operations
│   │   └── follow.ts         # Follow system
│   ├── trpc.ts               # tRPC initialization
│   └── root.ts               # Root router
├── middleware/
│   ├── auth.ts               # Authentication middleware
│   └── rateLimit.ts          # Rate limiting
└── utils/
    ├── errors.ts             # Error handling
    └── responses.ts          # Response formatting
```

#### Service Layer

```
services/
├── user.service.ts       # User business logic
├── feed.service.ts       # Feed business logic
├── url.service.ts        # URL business logic
├── tag.service.ts        # Tag business logic
└── metadata.service.ts   # Metadata extraction
```

#### Data Access Layer

```
data/
├── repositories/
│   ├── user.repository.ts
│   ├── feed.repository.ts
│   ├── url.repository.ts
│   └── tag.repository.ts
├── schemas/
│   └── database.ts       # Drizzle schemas
└── migrations/
    └── *.sql            # Database migrations
```

## Data Flow

### User Registration Flow

```
1. User clicks "Sign Up" → Clerk Auth UI
2. Clerk handles authentication → Returns user token
3. Frontend receives token → Stores in secure cookie
4. Frontend calls /api/profiles → Creates user profile
5. Database creates user record → Returns profile data
6. Frontend redirects to dashboard → Shows personalized feed
```

### URL Sharing Flow

```
1. User clicks browser extension → Extension extracts metadata
2. Extension calls /api/urls → Validates and stores URL
3. Service layer processes URL → Creates user-url relationship
4. Feed service updates feeds → Notifies followers
5. Database commits transaction → Returns success response
6. Extension shows success → User sees URL in feed
```

### Feed Loading Flow

```
1. User opens dashboard → Frontend calls /api/feeds
2. API validates user token → Queries database for feed items
3. Database returns feed data → API formats response
4. Frontend receives data → Renders feed components
5. User scrolls down → Triggers infinite scroll
6. API returns next page → Frontend appends to feed
```

## Integration Points

### External Services

#### Clerk Integration

```typescript
// Authentication flow
const { user, isLoaded } = useUser();

// User management
const { userList } = useUserList({
  limit: 10,
  orderBy: "created_at",
});

// Webhooks for user events
app.post("/api/webhooks/clerk", (req, res) => {
  const { type, data } = req.body;

  switch (type) {
    case "user.created":
      handleUserCreated(data);
      break;
    case "user.deleted":
      handleUserDeleted(data);
      break;
  }
});
```

#### Cloudinary Integration

```typescript
// Image upload
const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "linkdeck");

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });

  return response.json();
};

// Image optimization
const getOptimizedImage = (publicId: string, width: number) => {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${width},f_auto,q_auto/${publicId}`;
};
```

#### Browser Extension Integration

```typescript
// Extension API calls
const saveUrl = async (url: string, metadata: Metadata) => {
  const response = await fetch("/api/urls", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, metadata }),
  });

  return response.json();
};
```

### Internal Integrations

#### Database Integration

```typescript
// Drizzle ORM setup
export const db = drizzle(postgres(connectionString), {
  schema: {
    users,
    userProfiles,
    urls,
    tags,
    feeds,
  },
});

// Connection pooling
const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

#### Caching Integration

```typescript
// Redis caching (future)
const redis = new Redis(process.env.REDIS_URL);

const getCachedFeed = async (userId: string) => {
  const cached = await redis.get(`feed:${userId}`);
  if (cached) return JSON.parse(cached);

  const feed = await getFeedFromDB(userId);
  await redis.setex(`feed:${userId}`, 300, JSON.stringify(feed));
  return feed;
};
```

## Dependency Management

### Package Dependencies

#### Core Dependencies

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "@tanstack/react-query": "^5.0.0",
    "@trpc/server": "^11.0.0",
    "@trpc/client": "^11.0.0",
    "@trpc/react-query": "^11.0.0",
    "@trpc/next": "^11.0.0",
    "drizzle-orm": "^0.29.0",
    "@clerk/nextjs": "^5.0.0",
    "zod": "^3.22.0",
    "react-hook-form": "^7.45.0"
  }
}
```

#### Development Dependencies

```json
{
  "devDependencies": {
    "@biomejs/biome": "^1.4.0",
    "typescript": "^5.2.0",
    "vitest": "^1.0.0",
    "drizzle-kit": "^0.20.0"
  }
}
```

### Dependency Injection

```typescript
// Service container
class ServiceContainer {
  private services = new Map();

  register<T>(key: string, factory: () => T) {
    this.services.set(key, factory);
  }

  get<T>(key: string): T {
    const factory = this.services.get(key);
    if (!factory) throw new Error(`Service ${key} not found`);
    return factory();
  }
}

// Usage
const container = new ServiceContainer();
container.register("userService", () => new UserService(db));
container.register("feedService", () => new FeedService(db));
```

## Scalability Considerations

### Horizontal Scaling

#### Database Scaling

```typescript
// Read replicas for read-heavy operations
const readDB = drizzle(postgres(readConnectionString));
const writeDB = drizzle(postgres(writeConnectionString));

// Route reads to replica, writes to primary
const getUserProfile = async (userId: string) => {
  return await readDB.query.userProfiles.findFirst({
    where: (profiles, { eq }) => eq(profiles.userId, userId),
  });
};
```

#### API Scaling

```typescript
// Load balancing with multiple instances
const server = createServer({
  port: process.env.PORT || 3000,
  host: "0.0.0.0",
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: Date.now() });
});
```

### Vertical Scaling

#### Memory Optimization

```typescript
// Lazy loading for large datasets
const useInfiniteFeed = (userId: string) => {
  return useInfiniteQuery({
    queryKey: ["feed", userId],
    queryFn: ({ pageParam }) => getFeedPage(userId, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
};
```

#### CPU Optimization

```typescript
// Background job processing
const processMetadata = async (urlId: string) => {
  // Process in background to avoid blocking API
  setImmediate(async () => {
    const metadata = await extractMetadata(urlId);
    await updateUrlMetadata(urlId, metadata);
  });
};
```

## Performance Architecture

### Caching Strategy

#### Multi-Level Caching

```typescript
// 1. Browser cache (HTTP headers)
app.use((req, res, next) => {
  res.set("Cache-Control", "public, max-age=300"); // 5 minutes
  next();
});

// 2. CDN cache (Cloudflare)
const getCachedImage = (imageId: string) => {
  return `https://cdn.bookmarkflow.com/images/${imageId}`;
};

// 3. Application cache (Redis)
const getCachedData = async (key: string) => {
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
};
```

#### Database Query Optimization

```typescript
// Indexed queries
const getFeedItems = async (userId: string, limit: number) => {
  return await db.query.feeds.findMany({
    where: (feeds, { eq }) => eq(feeds.userId, userId),
    orderBy: (feeds, { desc }) => desc(feeds.createdAt),
    limit,
    // Use indexes on userId and createdAt
  });
};
```

### CDN Strategy

```typescript
// Static assets
const staticAssets = {
  css: "https://cdn.linkdeck.com/css/",
  js: "https://cdn.linkdeck.com/js/",
  images: "https://cdn.linkdeck.com/images/",
};

// API responses
const apiResponses = {
  baseUrl: "https://api.linkdeck.com",
  timeout: 5000,
  retries: 3,
};
```

## Security Architecture

### Authentication & Authorization

#### JWT Token Management

```typescript
// Token validation middleware
const validateToken = async (req: Request) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) throw new Error("No token provided");

  const payload = jwt.verify(token, process.env.JWT_SECRET!);
  return payload as UserPayload;
};
```

#### Role-Based Access Control

```typescript
// Permission system
const permissions = {
  READ_FEED: ["user", "admin"],
  WRITE_URL: ["user", "admin"],
  DELETE_USER: ["admin"],
};

const hasPermission = (user: User, permission: string) => {
  return permissions[permission]?.includes(user.role) || false;
};
```

### Data Protection

#### Input Sanitization

```typescript
// XSS prevention
const sanitizeInput = (input: string) => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ["b", "i", "em", "strong"],
    ALLOWED_ATTR: [],
  });
};
```

#### SQL Injection Prevention

```typescript
// Parameterized queries (Drizzle handles this)
const getUser = async (userId: string) => {
  return await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, userId), // Safe
  });
};
```

## Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────────────────────────────────┐
│                        Load Balancer                           │
│                        (Cloudflare)                            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Application Servers                     │
│                    (Vercel/Netlify Edge)                       │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Database                                │
│                    (PostgreSQL Managed)                        │
└─────────────────────────────────────────────────────────────────┘
```

### Environment Configuration

```typescript
// Environment variables
const config = {
  database: {
    url: process.env.DATABASE_URL!,
    ssl: process.env.NODE_ENV === "production",
  },
  auth: {
    clerkSecretKey: process.env.CLERK_SECRET_KEY!,
    clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
  },
  storage: {
    cloudinaryUrl: process.env.CLOUDINARY_URL!,
  },
};
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm test
      - run: pnpm lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm build
      - run: pnpm deploy
```

## Monitoring & Observability

### Logging Strategy

```typescript
// Structured logging
import { logger } from "@repo/shared/utils/logger";

logger.info("User created", {
  userId: user.id,
  username: user.username,
  timestamp: new Date().toISOString(),
});

logger.error("Database error", {
  error: error.message,
  stack: error.stack,
  query: sqlQuery,
});
```

### Metrics Collection

```typescript
// Custom metrics
const metrics = {
  apiRequests: new Counter("api_requests_total"),
  apiDuration: new Histogram("api_duration_seconds"),
  activeUsers: new Gauge("active_users"),
};

// Usage
metrics.apiRequests.inc({ endpoint: "/api/feeds" });
metrics.apiDuration.observe(duration, { endpoint: "/api/feeds" });
```

### Error Tracking

```typescript
// Sentry integration
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

// Error reporting
try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

### Health Checks

```typescript
// Health check endpoints
app.get("/health", async (req, res) => {
  const checks = await Promise.allSettled([checkDatabase(), checkRedis(), checkExternalServices()]);

  const isHealthy = checks.every((check) => check.status === "fulfilled");

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "healthy" : "unhealthy",
    checks: checks.map((check) => ({
      service: check.status,
      details: check.status === "fulfilled" ? check.value : check.reason,
    })),
  });
});
```

---

This architecture document provides the technical foundation for building and scaling the LinkDeck platform with modern technologies and best practices.
