# Publishing Guide

This guide will walk you through publishing your `vue-google-translate-widget` package to npm.

## Prerequisites

1. **Node.js and npm**: Ensure you have Node.js (v16+) and npm installed
2. **npm account**: Create an account at [npmjs.com](https://www.npmjs.com/signup)
3. **Git repository**: Initialize a git repository and push to GitHub

## Step-by-Step Publishing Process

### 1. Initial Setup

```bash
# Navigate to your package directory
cd google-translate-vue

# Install dependencies
npm install

# Build the package
npm run build
```

### 2. Update Package Information

Edit `package.json` and update:

```json
{
  "name": "vue-google-translate-widget",  // Change if name is taken
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/vue-google-translate-widget.git"
  },
  "bugs": {
    "url": "https://github.com/yourusername/vue-google-translate-widget/issues"
  },
  "homepage": "https://github.com/yourusername/vue-google-translate-widget#readme"
}
```

### 3. Login to npm

```bash
# Login to npm (you'll be prompted for username, password, and email)
npm login

# Verify you're logged in
npm whoami
```

### 4. Check Package Name Availability

```bash
# Check if the package name is available
npm search vue-google-translate-widget
```

If the name is taken, update it in `package.json`:

```json
{
  "name": "@yourusername/vue-google-translate-widget"
}
```

### 5. Test Your Package Locally

Before publishing, test your package:

```bash
# Create a test project
mkdir test-app
cd test-app
npm init -y
npm install vue

# Link your package
cd ../google-translate-vue
npm link
cd ../test-app
npm link vue-google-translate-widget

# Test importing and using the package
```

### 6. Verify Package Contents

```bash
# See what will be included in your package
npm pack --dry-run

# This should show:
# - dist/
# - package.json
# - README.md
# - API.md
# - LICENSE (if you have one)
```

### 7. Add a License

Create a `LICENSE` file. MIT License is common:

```bash
cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2024 Your Name

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF
```

### 8. Publish to npm

```bash
# For first-time publish
npm publish

# If using a scoped package (@yourusername/package-name)
npm publish --access public
```

### 9. Verify Publication

```bash
# Check your package on npm
npm info vue-google-translate-widget

# Visit your package page
# https://www.npmjs.com/package/vue-google-translate-widget
```

## Publishing Updates

When you make changes and want to publish an update:

### 1. Update Version

```bash
# For bug fixes (1.0.0 -> 1.0.1)
npm version patch

# For new features (1.0.0 -> 1.1.0)
npm version minor

# For breaking changes (1.0.0 -> 2.0.0)
npm version major
```

### 2. Rebuild and Publish

```bash
# Build the package
npm run build

# Publish the update
npm publish
```

## Best Practices

### Version Management

Follow [Semantic Versioning](https://semver.org/):
- **Patch** (1.0.x): Bug fixes
- **Minor** (1.x.0): New features (backward compatible)
- **Major** (x.0.0): Breaking changes

### Changelog

Create a `CHANGELOG.md` file:

```markdown
# Changelog

## [1.0.0] - 2024-01-15
### Added
- Initial release
- `useGoogleTranslate` composable
- `GoogleTranslateWidget` component
- `GoogleTranslateButton` component
- Support for 100+ languages

## [1.0.1] - 2024-01-20
### Fixed
- Fix cookie persistence issue
- Improve TypeScript definitions
```

### Documentation

Ensure your README includes:
- Clear installation instructions
- Quick start examples
- API documentation link
- License information
- Contributing guidelines

### Testing Before Publishing

```bash
# Always test the build
npm run build

# Check for TypeScript errors
npx vue-tsc --noEmit

# Test the package locally
npm pack
# This creates a .tgz file you can install in a test project
```

## Common Issues

### Issue: "You do not have permission to publish"

**Solution**: The package name might be taken or you need to use a scoped package.

```bash
# Use a scoped package
npm publish --access public
```

### Issue: "Package name too similar to existing package"

**Solution**: Choose a more unique name or use your username scope:

```json
{
  "name": "@yourusername/google-translate-vue"
}
```

### Issue: Build files not included

**Solution**: Check your `.npmignore` and ensure `dist/` is not ignored.

### Issue: TypeScript types not working

**Solution**: Ensure these are in `package.json`:

```json
{
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts"
    }
  }
}
```

## Publishing Checklist

Before publishing, ensure:

- [ ] Package builds successfully (`npm run build`)
- [ ] All dependencies are correctly listed in `package.json`
- [ ] README is comprehensive and accurate
- [ ] Version number is correct
- [ ] LICENSE file exists
- [ ] `.npmignore` excludes unnecessary files
- [ ] TypeScript types are generated and exported
- [ ] Package name is available or scoped correctly
- [ ] You're logged into npm (`npm whoami`)
- [ ] Package has been tested locally

## Unpublishing

If you need to unpublish:

```bash
# Unpublish a specific version (within 72 hours)
npm unpublish vue-google-translate-widget@1.0.0

# Unpublish entire package (within 72 hours, use with caution!)
npm unpublish vue-google-translate-widget --force
```

⚠️ **Warning**: Unpublishing is not recommended for packages that others depend on!

## Getting Help

- [npm Documentation](https://docs.npmjs.com/)
- [npm Support](https://www.npmjs.com/support)
- [Semantic Versioning](https://semver.org/)

## Next Steps After Publishing

1. Add badges to your README
2. Create a demo/playground
3. Set up CI/CD for automated testing
4. Add to Vue ecosystem lists
5. Share on social media and Vue community forums