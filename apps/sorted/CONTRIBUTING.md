# Contributing to Sorted - Instagram Reel Sorter

First off, thank you for considering contributing to Sorted! It's people like you that make Sorted a great tool for the Instagram community.

## Code of Conduct

By participating in this project, you are expected to uphold our standards of respectful and professional behavior. We're all here to make a great tool together!

### Our Standards

**Positive behaviors include:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behaviors include:**
- Trolling, insulting/derogatory comments, and personal attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the [existing issues](https://github.com/delulu/sorted/issues) to avoid duplicates. When you create a bug report, include as many details as possible:

**Bug Report Template:**

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected behavior**
A clear description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
 - OS: [e.g. macOS, Windows, Linux]
 - Browser: [e.g. Chrome 120, Edge 120]
 - Extension Version: [e.g. 1.0.0]
 - Instagram Profile Tested: [e.g. @instagram]

**Console Errors**
Open Chrome DevTools (F12) → Console tab and paste any errors here:
\`\`\`
Paste console errors here
\`\`\`

**Additional context**
Add any other context about the problem here.
```

### Suggesting Features

Feature suggestions are welcome! Before creating a feature request, please:

1. Check [existing issues](https://github.com/delulu/sorted/issues) for similar requests
2. Consider if the feature aligns with Sorted's core purpose (sorting Instagram reels)
3. Think about how the feature would benefit the majority of users

**Feature Request Template:**

```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Use case**
How would this feature be used? Who would benefit from it?

**Mockups (optional)**
If you have mockups or examples, include them here.

**Additional context**
Any other context about the feature request.
```

### Pull Requests

We actively welcome your pull requests! Here's how to contribute code:

#### 1. Fork & Clone

```bash
# Fork the repository on GitHub first, then:
git clone https://github.com/YOUR_USERNAME/sorted.git
cd sorted/apps/sorted
```

#### 2. Set Up Development Environment

```bash
# Install dependencies (from monorepo root)
pnpm install

# Start development mode
pnpm dev
```

#### 3. Create a Branch

```bash
# Create a branch from main
git checkout -b feature/your-feature-name

# Or for bug fixes:
git checkout -b fix/bug-description
```

**Branch naming conventions:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks

#### 4. Make Your Changes

**Code Style:**
- We use [Biome](https://biomejs.dev/) for linting and formatting
- Run `pnpm format` before committing
- Follow existing code patterns and conventions
- Write clear, self-documenting code

**TypeScript:**
- Use proper types (avoid `any` when possible)
- Leverage TypeScript's type inference
- Document complex types with comments

**React Best Practices:**
- Use functional components and hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Minimize prop drilling (use context when appropriate)

**CSS/Tailwind:**
- Follow Tailwind utility-first approach
- Use indigo (#6366f1) for brand colors
- Maintain responsive design (test on mobile viewports)
- Keep styling consistent with existing UI

#### 5. Test Thoroughly

**Before submitting, test:**

```bash
# Build production version
pnpm build

# Load unpacked extension in Chrome
# Navigate to chrome://extensions/
# Enable Developer mode
# Click "Load unpacked" → select .output/chrome-mv3/
```

**Test checklist:**
- [ ] Extension builds without errors (`pnpm build`)
- [ ] TypeScript compiles without errors (`pnpm compile`)
- [ ] Extension loads in Chrome without errors
- [ ] Feature works on Instagram (test on multiple profiles)
- [ ] Responsive design works (test mobile viewport in DevTools)
- [ ] No console errors or warnings
- [ ] Existing features still work (regression testing)
- [ ] Performance is acceptable (no slowdowns or freezes)

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for comprehensive testing checklist.

#### 6. Commit Your Changes

**Commit message format:**

```
<type>: <subject>

<body (optional)>

<footer (optional)>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```bash
git commit -m "feat: add export functionality for sorted reels"

git commit -m "fix: resolve rank badge positioning on small screens"

git commit -m "docs: update README with installation instructions"
```

**Good commit practices:**
- Write in present tense ("add feature" not "added feature")
- Keep subject line under 50 characters
- Use body to explain *what* and *why*, not *how*
- Reference issues: "Fixes #123" or "Closes #456"

#### 7. Push & Create Pull Request

```bash
# Push your branch
git push origin feature/your-feature-name
```

**On GitHub:**
1. Navigate to your fork
2. Click "New Pull Request"
3. Select your branch
4. Fill out the PR template

**Pull Request Template:**

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?
Describe the tests you ran to verify your changes:
- [ ] Tested on Chrome 120+
- [ ] Tested on Instagram profiles: @instagram, @cristiano, @natgeo
- [ ] Tested responsive layouts (mobile, tablet, desktop)
- [ ] Checked console for errors
- [ ] Verified no performance degradation

## Screenshots (if applicable)
Add screenshots of your changes here.

## Checklist
- [ ] My code follows the project's code style (ran `pnpm format`)
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] My changes generate no new warnings or errors
- [ ] I have tested my changes thoroughly
- [ ] I have updated the documentation (README, CHANGELOG, etc.)

## Related Issues
Closes #(issue number)
```

#### 8. Code Review Process

- Maintainers will review your PR within 3-5 business days
- Address any requested changes by pushing new commits
- Once approved, a maintainer will merge your PR
- Your contribution will be included in the next release!

**What we look for in code review:**
- Code quality and maintainability
- Adherence to project conventions
- Adequate testing
- Clear commit messages
- Updated documentation

## Development Workflow

### Project Structure

```
apps/sorted/
├── entrypoints/          # Extension entry points
│   ├── popup/           # Popup UI
│   ├── content/         # Content scripts (Instagram page)
│   ├── background.ts    # Background service worker
│   └── interceptor.ts   # GraphQL interceptor
├── public/
│   └── icon/           # Extension icons
├── scripts/            # Build scripts
├── wxt.config.ts       # WXT configuration
└── package.json        # Dependencies
```

### Key Files

- **`entrypoints/content/index.tsx`** - Main sorting logic
- **`entrypoints/popup/App.tsx`** - Extension popup interface
- **`entrypoints/interceptor.ts`** - Instagram GraphQL interception
- **`wxt.config.ts`** - Extension manifest and build config

### Development Commands

```bash
# Start development server (hot reload)
pnpm dev

# Build for production
pnpm build

# Create deployment zip
pnpm zip

# Type checking
pnpm compile

# Format code
pnpm format

# Regenerate icons
pnpm generate-icons
```

### Debugging

**Chrome DevTools:**
- **Popup:** Right-click extension icon → "Inspect popup"
- **Content script:** Open DevTools on Instagram page (F12)
- **Background script:** Visit `chrome://extensions/` → "Inspect views: background page"
- **Network:** Monitor GraphQL requests in Network tab

**Common debugging tips:**
- Use `console.log()` liberally during development
- Check Chrome's extension error page: `chrome://extensions/`
- Reload extension after code changes: Click reload icon in `chrome://extensions/`
- Clear cache: Uninstall and reinstall extension

## Code Review Guidelines

### For Contributors

When your PR is under review:
- Be patient - reviews may take a few days
- Be open to feedback - we're all learning
- Address requested changes promptly
- Ask questions if something is unclear
- Don't take criticism personally - it's about the code, not you

### For Reviewers

When reviewing PRs:
- Be respectful and constructive
- Explain *why* changes are needed
- Acknowledge good work
- Focus on code, not the person
- Suggest alternatives, don't just say "this is wrong"
- Approve PRs that improve the project, even if not perfect

## Release Process

(For maintainers)

1. Update version in `package.json` and `wxt.config.ts`
2. Update `CHANGELOG.md` with changes
3. Create git tag: `git tag v1.x.x`
4. Push tag: `git push origin v1.x.x`
5. Build production: `pnpm build && pnpm zip`
6. Upload `.zip` to Chrome Web Store Developer Console
7. Create GitHub release with changelog

## Style Guide

### JavaScript/TypeScript

```typescript
// ✅ Good
const sortedReels = reels.sort((a, b) => b.likes - a.likes);

// ❌ Avoid
var sorted_reels = reels.sort((a, b) => {
  return b.likes - a.likes;
});

// ✅ Use descriptive names
const isReelsSortingActive = true;

// ❌ Avoid abbreviations
const isSrtActive = true;

// ✅ Use async/await
async function fetchReels() {
  const response = await fetch(url);
  return response.json();
}

// ❌ Avoid callback hell
function fetchReels(callback) {
  fetch(url).then(r => r.json()).then(callback);
}
```

### React Components

```tsx
// ✅ Functional components with hooks
export const ReelCard: React.FC<Props> = ({ reel, rank }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div onMouseEnter={() => setIsHovered(true)}>
      {/* Component JSX */}
    </div>
  );
};

// ❌ Avoid class components
export class ReelCard extends React.Component {
  // ...
}
```

### CSS/Tailwind

```tsx
// ✅ Use Tailwind utilities
<div className="flex items-center justify-between p-4 bg-indigo-600 rounded-lg">

// ❌ Avoid inline styles
<div style={{ display: 'flex', padding: '16px', background: '#6366f1' }}>

// ✅ Responsive design
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

// ✅ Use design system colors
<button className="bg-indigo-600 hover:bg-indigo-700">
```

## Questions?

- Check our [README](README.md) for general information
- Read the [TESTING_GUIDE.md](TESTING_GUIDE.md) for testing instructions
- Browse [existing issues](https://github.com/delulu/sorted/issues)
- Ask in [GitHub Discussions](https://github.com/delulu/sorted/discussions)
- Email: hello@delulu.social

## Recognition

Contributors will be:
- Listed in the project's contributors page
- Mentioned in release notes for significant contributions
- Forever appreciated by the community! 🎉

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Sorted!** Every contribution, no matter how small, makes a difference. 💙
