# ReLog - NPM Publishing Guide

This guide walks through publishing ReLog to npm.

## Prerequisites

1. **npm Account**
   - Create account at https://www.npmjs.com
   - Verify email address
   - Setup 2FA if desired

2. **Local Setup**
   ```bash
   npm login
   npm whoami  # Verify login
   ```

3. **Repository Setup**
   - GitHub repository created
   - LICENSE file in place (MIT)
   - README.md with full documentation
   - All tests passing
   - Build artifacts generated

## Pre-Publication Checklist

### Code Quality
- [ ] All tests passing: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors
- [ ] No security vulnerabilities: `npm audit`
- [ ] Code formatted consistently

### Documentation
- [ ] README.md complete with examples
- [ ] CHANGELOG.md updated
- [ ] API documented with JSDoc
- [ ] SECURITY.md reviewed
- [ ] CONTRIBUTING.md in place
- [ ] Examples in `/examples` working

### Package Configuration
- [ ] package.json metadata complete
  - [ ] `name` field: `relog-lib`
  - [ ] `version` field: `1.0.0`
  - [ ] `description` accurate
  - [ ] `keywords` relevant
  - [ ] `author` filled
  - [ ] `license` set to MIT
  - [ ] `repository` points to GitHub
  - [ ] `bugs` field populated
  - [ ] `homepage` set
- [ ] .npmignore properly configured
- [ ] package.json `files` field specifies dist/

### Git Setup
- [ ] All changes committed
- [ ] No uncommitted files
- [ ] Git tag ready: `git tag v1.0.0`
- [ ] Branch protection rules set on main

## Publishing Steps

### Step 1: Update Version

```bash
# Make sure you're on main branch
git checkout main
git pull origin main

# Create version tag
git tag v1.0.0

# Push tag to GitHub
git push origin v1.0.0
```

### Step 2: Build and Verify

```bash
# Clean build
rm -rf dist/
npm run build

# Verify build contents
ls -la dist/

# Should contain:
# - compression.d.ts, compression.js
# - crypto.d.ts, crypto.js
# - index.d.ts, index.js
# - relog.d.ts, relog.js
# - storage.d.ts, storage.js
# - types.d.ts, types.js
```

### Step 3: Test Installation

```bash
# Create test directory
mkdir -p /tmp/relog-test
cd /tmp/relog-test

# Initialize test project
npm init -y

# Test local installation (before publishing)
npm install /path/to/relog
npm list relog-lib
```

### Step 4: Publish to npm

```bash
cd /path/to/relog

# Dry run first (no actual publish)
npm publish --dry-run

# Check output - should show dist files being published

# Actual publish
npm publish

# Verify on npm
npm info relog-lib
```

## Post-Publication

### Verification
```bash
# Check npm registry
npm info relog-lib

# Install from npm
npm install relog-lib

# Verify version
npm list relog-lib
```

### GitHub Release
1. Go to GitHub repo
2. Create new Release
3. Select tag v1.0.0
4. Add release notes from CHANGELOG.md
5. Publish release

### Announcements
- [ ] Update project website
- [ ] Post on social media
- [ ] Send to mailing list
- [ ] Update documentation links
- [ ] Add to package registries (if applicable)

## Package.json Example

```json
{
  "name": "relog-lib",
  "version": "1.0.0",
  "description": "Lightweight encrypted, compressed, rewritable log system for Node.js",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist/",
    "README.md",
    "SECURITY.md",
    "LICENSE",
    "CHANGELOG.md"
  ],
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "dev": "tsc --watch",
    "prepublishOnly": "npm run build && npm run test"
  },
  "keywords": [
    "logging",
    "encryption",
    "compression",
    "secure",
    "rewritable",
    "typescript",
    "aes-256",
    "encrypted-logs"
  ],
  "author": "Your Name",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/relog.git"
  },
  "bugs": {
    "url": "https://github.com/yourusername/relog/issues"
  },
  "homepage": "https://github.com/yourusername/relog#readme",
  "engines": {
    "node": ">=16.0.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.11",
    "@types/node": "^20.10.6",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "typescript": "^5.3.3"
  }
}
```

## Versioning Strategy

### Semantic Versioning (semver)
- **MAJOR**: Breaking changes (e.g., API changes)
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

Examples:
- `1.0.0` → `1.0.1`: Patch release (1.0.1)
- `1.0.0` → `1.1.0`: Minor release (1.1.0)
- `1.0.0` → `2.0.0`: Major release (2.0.0)

## Version Release Timeline

### v1.0.0
- Initial production release
- Core features complete
- Full documentation
- Test coverage >80%

### v1.1.0 (Future)
- Performance improvements
- Additional query filters
- Bug fixes from community

### v2.0.0 (Future)
- Breaking API changes
- New storage backends
- Enhanced features

## Troubleshooting

### Issue: "403 Forbidden"
- Verify npm login: `npm whoami`
- Check email verification
- Verify package name availability
- Check organization access

### Issue: "ENEEDAUTH"
```bash
npm logout
npm login
npm publish
```

### Issue: "publish failed"
```bash
# Verify build
npm run build

# Check package contents
npm pack  # Creates tarball
tar tzf relog-lib-1.0.0.tgz
```

### Issue: Version already exists
```bash
# Cannot republish same version
# Increment version in package.json
npm version patch  # or minor/major
```

## Managing Updates

### For Patch Releases
```bash
# Fix bug
npm run test  # Verify fix
npm version patch
npm publish
```

### For Minor Releases
```bash
# Add feature
npm run test  # All tests pass
npm version minor
npm publish
```

### For Major Releases
```bash
# Breaking changes
# Update CHANGELOG
# Update docs
npm version major
npm publish
```

## Maintenance

### Monitoring
- Check npm registry for errors
- Monitor GitHub issues
- Track download statistics
- Subscribe to security alerts

### Updates
- Regularly update dependencies
- Fix security vulnerabilities
- Add requested features
- Improve documentation

### Support
- Respond to GitHub issues
- Help community members
- Accept quality pull requests
- Maintain backward compatibility when possible

## Additional Resources

- [npm Publishing Documentation](https://docs.npmjs.com/packages-and-modules/)
- [Semantic Versioning](https://semver.org/)
- [npm Package.json Reference](https://docs.npmjs.com/cli/v9/configuring-npm/package-json)
- [Publishing Security Best Practices](https://docs.npmjs.com/cli/v9/commands/npm-publish)

---

## Contact & Support

For questions about publishing or maintenance:
- Open GitHub issue
- Check npm documentation
- Email maintainers

---

Happy Publishing! 🚀
