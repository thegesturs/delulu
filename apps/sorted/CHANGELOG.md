# Changelog

All notable changes to the Sorted - Instagram Reel Sorter extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned for v1.1.0
- Dark mode refinements for better visual consistency
- Keyboard shortcuts (e.g., Ctrl+Shift+S to sort reels)
- Export functionality (CSV/JSON of sorted reels data)
- Additional sorting options (engagement rate, save count)
- Performance optimizations for large accounts (500+ reels)
- More loading state animations and variations

## [1.0.0] - 2026-01-19

### Initial Release

#### Added
- **Multiple Sorting Options**
  - Sort Instagram reels by Most Liked
  - Sort by Most Viewed
  - Sort by Most Commented
  - Sort by Oldest (chronological order)

- **User Interface**
  - Professional extension popup with active/inactive states
  - Responsive sorting control panel with dropdown menus
  - Beautiful indigo branding (#6366f1) throughout
  - Smooth loading overlay with triple-ring spinner animation
  - Progress indicators during reel collection ("Scroll 1/3", etc.)
  - Indigo vignette effect and backdrop blur during loading

- **Sorted Grid Features**
  - Responsive grid layout (2-5 columns based on screen size)
  - Rank badges (#1, #2, #3...) on each reel
  - Hover overlay showing detailed metrics (likes, views, comments)
  - Monospace font for consistent metric display
  - Support for 25, 50, or all reels sorting

- **Core Functionality**
  - GraphQL response interception for real-time data collection
  - Local Chrome storage for user preferences
  - One-click reset to restore Instagram's original grid order
  - Content script injection with clean Instagram integration

- **Developer Experience**
  - Built with WXT framework (Manifest V3)
  - React 19 with TypeScript for type safety
  - Tailwind CSS for utility-first styling
  - Hot reload development mode
  - Automated icon generation from SVG source
  - Comprehensive testing guide and documentation

- **Privacy & Security**
  - Zero data collection or external API calls
  - All processing happens locally in browser
  - Minimal permissions (storage, activeTab, Instagram host)
  - No analytics or tracking

- **Documentation**
  - Comprehensive README with usage instructions
  - TESTING_GUIDE.md with complete testing checklist
  - DESIGN_UPDATES.md documenting design system
  - Privacy policy page at delulu.social
  - CONTRIBUTING.md for open source contributors

- **Browser Support**
  - Chrome (v120+)
  - Microsoft Edge (Chromium-based)
  - Brave Browser

- **Extension Assets**
  - Professional icon set (16px to 128px)
  - Delulu logo integration
  - Chrome Web Store promotional images

### Technical Details
- Extension size: ~146 KB (compressed)
- Content script: 213 KB
- Popup: 189 KB
- Minimum Chrome version: 120
- Manifest version: 3

### Known Limitations
- Only works on Instagram profile reels tabs (not home feed or explore)
- Requires Instagram to load reels progressively (relies on scrolling)
- Large accounts (500+ reels) may take 30-60 seconds to sort all reels
- Depends on Instagram's current GraphQL API structure

---

## Release Notes

### Version Numbering

We follow Semantic Versioning (MAJOR.MINOR.PATCH):
- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality in a backwards compatible manner
- **PATCH** version for backwards compatible bug fixes

### How to Update

**From Chrome Web Store:**
- Extensions update automatically within 24 hours of new version release
- Force update: Visit `chrome://extensions/` and click "Update" button

**From Source:**
```bash
git pull origin main
pnpm install
pnpm build
# Reload extension in chrome://extensions/
```

### Reporting Issues

Found a bug or have a feature request? Please report it:
- GitHub Issues: https://github.com/delulu/sorted/issues
- Email: support@delulu.social

---

## Future Roadmap

### v1.1.0 (Q1 2026)
- Performance improvements for large accounts
- Export sorted data functionality
- Keyboard shortcuts
- Additional sorting metrics

### v2.0.0 (Q2 2026)
- Firefox support
- Filter by date range
- Compare multiple profiles
- Optional historical data tracking

---

[Unreleased]: https://github.com/delulu/sorted/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/delulu/sorted/releases/tag/v1.0.0
