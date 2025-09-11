# Tests Setup Package

This package provides shared test configuration and utilities for the monorepo.

## Features

- **Jest Extended Matchers**: Extends Vitest with additional matchers like `toBeString()`, `toHaveLength()`, etc.
- **TypeScript Support**: Full TypeScript support for all extended matchers
- **Vitest Integration**: Seamless integration with Vitest test runner

## Usage

The package is automatically configured in your `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    globals: true,
    setupFiles: "../tests-setup/src/index.ts",
  },
});
```

## Type Safety

This package includes TypeScript declarations that extend Vitest's `expect` interface with Jest Extended matchers. The type extensions are designed to be resilient to Vitest minor version updates.

### How It Works

1. **Runtime**: Jest Extended matchers are added to Vitest's expect function
2. **Types**: TypeScript declarations extend Vitest's `Assertion` interface
3. **Module Augmentation**: Uses TypeScript's `declare module` feature to safely extend Vitest types

### Compatibility

- ✅ **Vitest Minor Updates**: Safe for minor version updates (e.g., 3.2.x → 3.3.x)
- ⚠️ **Vitest Major Updates**: May require updates for major version changes (e.g., 3.x → 4.x)
- ✅ **Jest Extended Updates**: Compatible with Jest Extended updates

### Maintenance

To ensure compatibility with future Vitest updates:

1. **Monitor Releases**: Check Vitest release notes for breaking changes
2. **Test After Updates**: Run tests after updating Vitest
3. **Update Types**: If needed, update type declarations to match new Vitest interfaces

## Available Matchers

All Jest Extended matchers are available, including:

- `toBeString()`
- `toHaveLength()`
- `toMatch()`
- `toBeArray()`
- `toBeObject()`
- And many more...

See the [Jest Extended documentation](https://jest-extended.jestjs.io/docs/matchers) for the complete list.