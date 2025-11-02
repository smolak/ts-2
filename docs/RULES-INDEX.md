# Rules Index - Quick Reference

This document provides a quick reference to all project rules and where to find them.

## 📋 Quick Reference

### Import Rules
- **File**: `docs/CODING-GUIDELINE.md`
- **Section**: Import Rules
- **Key Rules**:
  - Same package/feature: Use relative imports (`../`, `./`)
  - Cross-package: Use `@repo/` alias
  - App to package: Use `@repo/` alias
  - Same app: Use `@/` alias for cleaner imports
  - Forbidden: App-to-app imports, package-to-app imports

### Component Organization
- **File**: `docs/ARCHITECTURE.md`
- **Section**: Component Architecture
- **Key Rules**:
  - Shared UI: `packages/ui/` for reusable components
  - Shared Features: `packages/*/` for cross-app features
  - App Features: `apps/*/features/` for app-specific features
  - CRUD Hooks: Single file per feature (e.g., `userProfile.ts`)

### Testing Strategy
- **File**: `docs/CODING-GUIDELINE.md`
- **Section**: Testing Patterns
- **Key Rules**:
  - Tests next to files: `./format-date.ts` and `./format-date.test.ts`
  - Avoid mocks: Use dependency injection, mock only at boundaries
  - Frontend: Mock DB/outside APIs
  - Backend: Mock external APIs, email services, file storage
  - **Test Execution**: Run tests immediately after changes to test files or source files

### Naming Conventions
- **File**: `docs/CODING-GUIDELINE.md`
- **Section**: Naming Conventions
- **Key Rules**:
  - Components: kebab-case for multi-word, original case for single-word (e.g., `user-profile.tsx`, `hover-card.tsx`)
  - Hooks: kebab-case starting with 'use' (e.g., `use-user-profile.ts`)
  - Utilities: kebab-case (e.g., `format-date.ts`)
  - Types: kebab-case (e.g., `user-profile.ts`)

### Technology Stack
- **File**: `docs/CODING-GUIDELINE.md`
- **Section**: Technology Stack
- **Key Rules**:
  - Frontend: Next.js, React 19, Tailwind CSS, Zustand, TanStack Query
  - API: tRPC
  - Auth: Clerk
  - Database: PostgreSQL, Drizzle ORM
  - Code Quality: BiomeJS
  - Monorepo: Turborepo

### User Experience & Design
- **File**: `docs/DESIGN.md`
- **Section**: User Experience
- **Key Rules**:
  - Design principles and patterns
  - UI component guidelines
  - User flow specifications

## 🔗 Cross-References

### Related Sections
- **Import Rules** ↔ **Component Organization** (file structure affects imports)
- **Naming Conventions** ↔ **Component Organization** (naming affects file structure)
- **Testing Strategy** ↔ **Component Organization** (test placement follows component structure)
- **Technology Stack** ↔ **All Sections** (tech choices affect all patterns)

### File Dependencies
```
docs/CODING-GUIDELINE.md
├── References docs/ARCHITECTURE.md for component patterns
└── References docs/DESIGN.md for UI patterns

docs/ARCHITECTURE.md
├── References docs/CODING-GUIDELINE.md for import rules
└── References docs/CODING-GUIDELINE.md for naming conventions

docs/DESIGN.md
└── References docs/CODING-GUIDELINE.md for implementation patterns
```

## 🚀 Quick Commands

### Validation
```bash
# Check all rules compliance
pnpm run check-rules

# Run all checks (types, lint, rules)
pnpm run check-all
```

### Development
```bash
# Start development server
pnpm run dev

# Build project
pnpm run build

# Format code
pnpm run format

# Lint code
pnpm run lint
```

## 📁 File Structure

```
├── .cursorrules                    # Rule references only
├── docs/
│   ├── CODING-GUIDELINE.md        # Import, naming, testing, tech stack
│   ├── ARCHITECTURE.md            # Component organization, file structure
│   ├── DESIGN.md                  # User experience, UI patterns
│   ├── RULES-INDEX.md             # This file - quick reference
│   └── CURSOR-RULES-VALIDATION.md # Validation system documentation
└── scripts/
    ├── check-rules.js             # Main validation script
    └── cursor-ai-client.js        # Rule reading and validation
```

## 🎯 Rule Tags

### Code Quality Rules
- **Import Rules** - How to structure imports
- **Naming Conventions** - How to name files, functions, variables
- **Testing Strategy** - How to write and organize tests
- **Technology Stack** - Which technologies to use

### Architecture Rules
- **Component Organization** - How to structure components
- **File Structure** - Where to place files
- **Package Dependencies** - How packages relate to each other
- **CRUD Hooks** - How to organize data operations

### Design Rules
- **User Experience** - How users interact with the system
- **UI Patterns** - How to design interfaces
- **Accessibility** - How to make interfaces accessible
- **Design System** - Consistent design patterns

## 🔍 Finding Rules

### By Task
- **Setting up imports** → docs/CODING-GUIDELINE.md → Import Rules
- **Creating components** → docs/ARCHITECTURE.md → Component Architecture
- **Writing tests** → docs/CODING-GUIDELINE.md → Testing Patterns
- **Running tests** → docs/CODING-GUIDELINE.md → Test Execution Rules
- **Naming files** → docs/CODING-GUIDELINE.md → Naming Conventions
- **Choosing technologies** → docs/CODING-GUIDELINE.md → Technology Stack

### By File Type
- **React components** → docs/ARCHITECTURE.md + docs/CODING-GUIDELINE.md
- **Hooks** → docs/CODING-GUIDELINE.md + docs/ARCHITECTURE.md
- **Tests** → docs/CODING-GUIDELINE.md
- **Utilities** → docs/CODING-GUIDELINE.md
- **Types** → docs/CODING-GUIDELINE.md

### By Context
- **New feature** → Check all files for relevant rules
- **Refactoring** → Focus on docs/ARCHITECTURE.md + docs/CODING-GUIDELINE.md
- **UI changes** → Check docs/DESIGN.md + docs/CODING-GUIDELINE.md
- **Testing** → Focus on docs/CODING-GUIDELINE.md

## 📝 Maintenance

### Adding New Rules
1. Add to appropriate `.md` file
2. Update this index if needed
3. Update validation script if needed
4. Test with `pnpm run check-rules`

### Updating Existing Rules
1. Update in the appropriate `.md` file
2. Update cross-references if needed
3. Test with `pnpm run check-rules`

### Rule Conflicts
If rules conflict between files:
1. Check which file is the primary source
2. Update the secondary file to reference the primary
3. Resolve the conflict in the primary file
4. Update cross-references

---

**Last Updated**: $(date)
**Version**: 1.0
**Maintainer**: Development Team
