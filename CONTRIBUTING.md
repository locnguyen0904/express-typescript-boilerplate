# Contributing

Guidelines for contributing to this project.

## Git Flow

### Branch Strategy

| Branch       | Purpose               | Naming                   |
| ------------ | --------------------- | ------------------------ |
| `main`       | Production-ready code | Protected                |
| `feature/*`  | New features          | `feature/add-user-auth`  |
| `fix/*`      | Bug fixes             | `fix/login-validation`   |
| `refactor/*` | Code improvements     | `refactor/user-service`  |
| `docs/*`     | Documentation only    | `docs/update-readme`     |
| `chore/*`    | Build, deps, config   | `chore/upgrade-mongoose` |

### Workflow

```bash
# 1. Create branch from main
git checkout main
git pull origin main
git checkout -b feature/my-feature

# 2. Make changes
# ... write code and tests ...

# 3. Verify before commit
npm run lint && npm test

# 4. Commit with conventional format
git add .
git commit -m "feat(users): add email verification"

# 5. Push and create PR
git push -u origin feature/my-feature

# 6. After merge, clean up
git checkout main
git pull origin main
git branch -d feature/my-feature
```

## Commit Convention

Format: `<type>(<scope>): <description>`

### Types

| Type       | When to Use                  |
| ---------- | ---------------------------- |
| `feat`     | New feature                  |
| `fix`      | Bug fix                      |
| `refactor` | Code change (no feature/fix) |
| `docs`     | Documentation only           |
| `test`     | Adding/updating tests        |
| `chore`    | Build, config, dependencies  |
| `style`    | Formatting (no code change)  |
| `perf`     | Performance improvement      |

### Scopes

| Scope      | Area                      |
| ---------- | ------------------------- |
| `auth`     | Authentication module     |
| `users`    | Users module              |
| `examples` | Examples module           |
| `core`     | Core (Repository, Errors) |
| `config`   | Configuration             |
| `deps`     | Dependencies              |

### Examples

```bash
# Features
feat(auth): add JWT refresh token endpoint
feat(users): implement soft delete

# Fixes
fix(auth): validate token expiry correctly
fix(users): prevent duplicate email registration

# Refactoring
refactor(core): remove base controller class
refactor(users): extract repository layer

# Other
docs: update architecture in README
test(users): add service unit tests
chore(deps): upgrade mongoose to v8
```

## Code Standards

### Before Every Commit

```bash
npm run prettier:fix    # Format code
npm run lint            # Check for issues
npm test                # Run tests
```

### Checklist

- [ ] Code follows existing patterns
- [ ] All inputs validated with Zod
- [ ] Route registered in OpenAPI (`*.doc.ts`)
- [ ] Tests written for new code
- [ ] TypeScript interfaces defined
- [ ] No `console.log` left in code
- [ ] Lint and tests pass

## Creating a New Module

Use the Plop generator for scaffolding:

```bash
npm run generate        # Interactive prompt
# or
npx plop module products  # Direct
```

This creates all 8 files (model, repository, service, controller, validation, doc, routes, test) with correct patterns.

### Manual Creation

If creating manually, follow this pattern:

```typescript
// product.repository.ts
import { Repository } from '@/core';
import Product, { IProduct } from './product.model';

export class ProductRepository extends Repository<IProduct> {
  constructor() {
    super(Product);
  }
}

// product.service.ts
import { ProductRepository } from './product.repository';
import { IProduct } from './product.model';

export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  async create(data: Partial<IProduct>): Promise<IProduct> {
    return this.productRepository.create(data);
  }

  async findById(id: string): Promise<IProduct | null> {
    return this.productRepository.findById(id);
  }
}

// container.ts
const productRepository = new ProductRepository();
const productService = new ProductService(productRepository);
```

## Pull Request Guidelines

### PR Title

Use same format as commits:

```
feat(users): add profile picture upload
```

### PR Description

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

- **Squash merge** to main (keeps history clean)
- Delete branch after merge

## Questions?

Review the other documentation in the `docs/` directory for further technical assistance.
