# Git Workflow

## Branch Strategy

- `main` – production
- `develop` – integration
- `feature/<name>` – new features
- `hotfix/<name>` – production fixes

## Workflow

1. Branch from `develop`.
2. Commit frequently with clear messages.
3. Rebase or merge latest `develop`.
4. Open Pull Request.
5. Pass lint, type checks and tests.
6. Code review approval.
7. Merge into `develop`.
8. Release from `develop` to `main`.

## Commit Format

- feat:
- fix:
- refactor:
- docs:
- test:
- chore:

Example:

```text
feat(board): add drag and drop task movement
```

## Pull Request Checklist

- Feature works as specified.
- Tests pass.
- Documentation updated.
- No console errors.
- No TODOs without issue references.