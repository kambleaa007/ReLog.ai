# Contributing to ReLog

Thank you for your interest in contributing to ReLog! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Focus on the code and ideas, not personal attacks
- Help each other learn and grow
- Report violations to maintainers

## Getting Started

### Prerequisites
- Node.js 16.x or higher
- npm or yarn
- Git

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/yourusername/relog.git
cd relog

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Watch mode for development
npm run dev
```

## Development Workflow

### 1. Fork and Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 2. Make Changes
- Write clean, readable code
- Follow existing code style (TypeScript strict mode)
- Add tests for new features
- Update documentation as needed

### 3. Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm test -- --coverage
```

### 4. Build
```bash
# Compile TypeScript
npm run build

# Verify build artifacts
ls dist/
```

### 5. Commit
```bash
git add .
git commit -m "feat: add new feature"
```

Use conventional commits:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `test:` for test additions
- `refactor:` for code improvements
- `chore:` for maintenance tasks
- `perf:` for performance improvements
- `security:` for security fixes

### 6. Push and Create PR
```bash
git push origin feature/your-feature-name
```

Create a Pull Request on GitHub with:
- Clear description of changes
- Reference to related issues (#123)
- Checklist of completed items

## Contribution Guidelines

### Code Quality
- Write TypeScript in strict mode
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and testable
- Avoid deep nesting

### Testing Requirements
- All new features must include tests
- All bug fixes must include tests that would have caught the bug
- Maintain >80% code coverage
- Tests should be deterministic (no flaky tests)

### Security Considerations
- Never log sensitive data (passwords, tokens, PII)
- Use secure defaults
- Review encryption/cryptography changes carefully
- Document security implications
- Follow OWASP guidelines

### Documentation
- Update README.md for user-facing changes
- Add JSDoc comments for public APIs
- Update CHANGELOG.md
- Add examples for new features
- Keep documentation up-to-date

## Areas for Contribution

### High Priority
- [ ] Performance optimizations
- [ ] Security audits and improvements
- [ ] Documentation enhancements
- [ ] Test coverage expansion
- [ ] Bug fixes

### Medium Priority
- [ ] Backend integration support (Redis, S3, etc.)
- [ ] Additional log formatting options
- [ ] Performance profiling tools
- [ ] CLI utilities
- [ ] Docker support

### Nice to Have
- [ ] Web dashboard prototype
- [ ] Log analysis features
- [ ] Integration examples
- [ ] Deployment guides
- [ ] Benchmark suite

## Documentation

### Adding to README.md
- Add section heading with `##`
- Use code examples where applicable
- Reference types and interfaces
- Keep explanations concise

### API Documentation
Add JSDoc comments to all public methods:

```typescript
/**
 * Log a message at INFO level
 * @param message - The message to log
 * @param metadata - Optional metadata object
 * @returns Promise that resolves when log is buffered
 * @example
 * await logger.info('User login', { userId: 'user123' });
 */
async info(message: string, metadata?: Record<string, unknown>): Promise<void> {
  // implementation
}
```

### Examples
Add practical examples to `/examples` directory:
- Clear use cases
- Error handling
- Best practices
- Comments explaining key points

## Testing Guidelines

### Test Structure
```typescript
describe('Feature Name', () => {
  let instance: YourClass;

  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  test('should do something specific', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = instance.method(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### Test Categories
- **Unit Tests**: Test individual functions/methods
- **Integration Tests**: Test interaction between components
- **Security Tests**: Test encryption, key handling
- **Performance Tests**: Test with large datasets

## Performance Considerations

When contributing optimizations:
1. Measure before and after
2. Document the improvement
3. Ensure no functionality is lost
4. Add performance tests if appropriate

## Reporting Issues

### Bug Reports
Include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment (Node.js version, OS, etc.)
- Error messages and stack traces

### Feature Requests
Include:
- Clear use case
- Proposed solution (if any)
- Potential implementation approach
- Impact on existing functionality

## Pull Request Process

1. **Code Review**
   - At least one approval required
   - Address feedback constructively
   - Update PR based on comments

2. **Checks**
   - All tests must pass
   - Code quality checks must pass
   - No merge conflicts
   - Coverage maintained or improved

3. **Merge**
   - Maintainer merges when ready
   - Squash commits if needed
   - Update CHANGELOG.md

## Development Tips

### Debugging
```typescript
// Enable debug logging
process.env.DEBUG = 'relog:*';

// Add console logs
console.log('Debug info:', variable);

// Use debugger
node --inspect-brk ./node_modules/.bin/jest
```

### Performance Testing
```bash
# Benchmark logging performance
npm run test -- --testNamePattern="rapid" --verbose
```

### Type Checking
```bash
# Check for TypeScript errors
npm run build

# Watch for changes
npm run dev
```

## Git Workflow

### Keep Fork Updated
```bash
git remote add upstream https://github.com/original/repo.git
git fetch upstream
git rebase upstream/main
git push origin main
```

### Clean Up Local Branches
```bash
git branch -d feature/merged-feature
git push origin --delete feature/merged-feature
```

## Licensing

By contributing to ReLog, you agree that your contributions will be licensed under the MIT License.

## Questions?

- Open a discussion in GitHub Discussions
- Check existing issues first
- Ask in pull request comments
- Email maintainers

---

## Thank You!

Your contributions help make ReLog better for everyone. We appreciate your time and effort!

**Happy Contributing! 🎉**
