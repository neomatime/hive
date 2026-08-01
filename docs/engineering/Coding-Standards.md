# Coding Standards

## Purpose
Defines engineering conventions for HIVE.

## General
- TypeScript only (`strict` mode).
- Follow ESLint and Prettier with zero warnings before merge.
- Prefer composition over inheritance.
- Keep functions small and single-purpose.
- Avoid `any`; use explicit types.

## Naming
- Components: PascalCase (`ProjectCard`)
- Files: kebab-case (`project-card.tsx`)
- Functions/variables: camelCase
- Constants: UPPER_SNAKE_CASE
- Interfaces: `IProject`, `ITask`

## React
- Functional components only.
- Business logic belongs in hooks/services.
- No database calls inside UI components.
- Reusable UI goes under `/components`.

## State
- Local: useState
- Shared UI: Zustand
- Server state: TanStack Query

## Styling
- Tailwind CSS only.
- Use design tokens from `design-system.md`.
- No inline colors or arbitrary brand variations.

## Database
- Access only through service layer.
- Validate all mutations server-side.
- Never expose service-role keys.

## Testing
- New features require unit tests.
- Critical flows require Playwright tests.

## Documentation
- Public components require prop documentation.
- Significant architectural changes must update the docs.