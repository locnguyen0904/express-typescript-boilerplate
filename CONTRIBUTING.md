# Contributing

Guidelines for contributing to this project.

## Git Flow

### Branch Naming

| Branch | Purpose | Example |
|--------|---------|---------|
| `main` | Production-ready code | Protected |
| `feature/*` | New features | `feature/add-user-auth` |
| `fix/*` | Bug fixes | `fix/login-validation` |
| `refactor/*` | Code improvements | `refactor/user-service` |
| `docs/*` | Documentation only | `docs/update-readme` |
| `chore/*` | Build, deps, config | `chore/upgrade-drizzle` |

### Workflow

```bash
# Create branch from main
git checkout main && git pull origin main
git checkout -b feature/my-feature

# Make changes, then verify
npm run prettier:fix && npm run lint && npm run test:up && npm test && npm run test:down

# Commit and push
git add .
git commit -m "feat(users): add email verification"
git push -u origin feature/my-feature
```

## Commit Convention

Format: `<type>(<scope>): <description>`

### Types

| Type | When to Use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code change (no feature/fix) |
| `docs` | Documentation only |
| `test` | Adding/updating tests |
| `chore` | Build, config, dependencies |
| `style` | Formatting (no code change) |
| `perf` | Performance improvement |

### Scopes

| Scope | Area |
|-------|------|
| `auth` | Authentication module |
| `users` | Users module |
| `examples` | Examples module |
| `core` | Core (errors, responses) |
| `config` | Configuration |
| `deps` | Dependencies |

### Examples

```bash
feat(auth): add jwt refresh token endpoint
fix(users): prevent duplicate email registration
refactor(core): simplify error handler
docs: update readme architecture section
test(users): add service unit tests
chore(deps): upgrade drizzle-orm to v0.45
```

## Code Standards

### Before Every Commit

```bash
npm run prettier:fix    # Format code
npm run lint            # Check for issues
npm run test:up         # Start test DB
npm test                # Run tests
npm run test:down       # Stop test DB
```

These checks also run automatically via husky pre-commit hooks.

### Checklist

- [ ] Code follows existing module patterns
- [ ] All inputs validated with Zod
- [ ] Route registered in OpenAPI (`*.doc.ts`)
- [ ] Tests written for new code
- [ ] TypeScript interfaces defined
- [ ] No `console.log` left in code
- [ ] Lint and tests pass

## Pull Requests

### Title Format

Same as commit messages:

```
feat(users): add profile picture upload
```

### Description

```markdown
## Summary
Brief description of changes.

## Changes
- Added X
- Updated Y
- Fixed Z

## Testing
- [ ] Unit tests added
- [ ] Manual testing done
```

### Merge Strategy

- Squash merge to main
- Delete branch after merge
