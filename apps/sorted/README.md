# Sorted - Instagram Reel Sorter

<div align="center">
  <img src="public/icon/128.png" alt="Sorted Extension Icon" width="128" height="128">

  <p><strong>Sort Instagram reels by engagement metrics with one click</strong></p>

  <p>
    <a href="https://chrome.google.com/webstore/detail/[EXTENSION-ID]">Chrome Web Store</a> •
    <a href="https://delulu.social">Website</a> •
    <a href="https://github.com/delulu/sorted/issues">Report Bug</a> •
    <a href="https://github.com/delulu/sorted/issues">Request Feature</a>
  </p>
</div>

---

## Overview

**Sorted** is a Chrome extension that helps you discover the most engaging Instagram reels by sorting them by likes, views, comments, or chronological order. Perfect for content creators, marketers, and social media enthusiasts analyzing Instagram content.

### Key Features

🎯 **Multiple Sorting Options**
- Sort by Most Liked - Find reels with highest engagement
- Sort by Most Viewed - Discover the most-watched content
- Sort by Most Commented - See which reels spark conversations
- Sort by Oldest - View content chronologically

📊 **Detailed Metrics**
- View likes, views, and comment counts at a glance
- Hover over reels to see engagement statistics
- Rank badges show content performance (#1, #2, #3...)

🎨 **Beautiful Interface**
- Professional design with indigo branding (#6366f1)
- Responsive grid layout (2-5 columns based on screen size)
- Smooth animations and loading states
- Seamless integration with Instagram's interface

⚡ **Fast & Efficient**
- Sort 25, 50, or all reels on a profile
- Real-time data collection via GraphQL interception
- Instant sorting with visual progress feedback
- One-click reset to restore Instagram's original order

🔒 **Privacy Focused**
- No data collection or tracking
- No external servers or API calls
- All processing happens locally in your browser
- Uses Chrome's local storage only for preferences

---

## Installation

### From Chrome Web Store (Recommended)

> **Note:** Extension is currently under review. Once published, install from the [Chrome Web Store](https://chrome.google.com/webstore/detail/[EXTENSION-ID]).

### From Source (Developers)

1. **Clone the repository**
   ```bash
   git clone https://github.com/delulu/sorted.git
   cd delulu/apps/sorted
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Build the extension**
   ```bash
   pnpm build
   ```

4. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `.output/chrome-mv3/` directory

---

## Usage

### Quick Start

1. **Navigate to Instagram**
   - Go to any Instagram profile (e.g., https://www.instagram.com/instagram/)
   - Click on the **Reels** tab to view their reel grid

2. **Activate Sorted**
   - Click the Sorted extension icon in your Chrome toolbar
   - Verify the extension shows "Ready to sort reels!"

3. **Choose Your Sort**
   - Select sorting metric: Most Liked, Most Viewed, Most Commented, or Oldest
   - Choose quantity: 25 reels, 50 reels, or All
   - Click **"Sort Reels"** button

4. **View Results**
   - Watch the loading animation as reels are collected and sorted
   - Browse the sorted grid with rank badges
   - Hover over reels to see detailed engagement metrics

5. **Reset (Optional)**
   - Click **"Reset"** button to restore Instagram's original order
   - Sort again with different criteria as needed

### Screenshots

> **TODO:** Add screenshots once extension is published
> - Extension popup (active state)
> - Sorted reels grid with rank badges
> - Metrics overlay on hover
> - Loading state animation

---

## Technology Stack

- **[WXT](https://wxt.dev/)** - Modern web extension framework (Manifest V3)
- **[React 19](https://react.dev/)** - UI library with latest features
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling
- **Chrome Extension APIs** - Storage, activeTab, content scripts
- **Instagram GraphQL** - Data collection via response interception

---

## Development

### Prerequisites

- Node.js 18+ and pnpm installed
- Chrome browser for testing
- Basic understanding of Chrome extensions

### Development Commands

```bash
# Start development mode with hot reload
pnpm dev

# Build for production (Chrome)
pnpm build

# Create deployment zip file
pnpm zip

# Type checking
pnpm compile

# Regenerate extension icons
pnpm generate-icons
```

### Development Workflow

1. **Start dev server**
   ```bash
   pnpm dev
   ```

2. **Load extension in Chrome**
   - Navigate to `chrome://extensions/`
   - Enable Developer mode
   - Load unpacked from `.output/chrome-mv3/`

3. **Make changes**
   - Extension auto-reloads on file changes
   - Refresh Instagram page to see updates

4. **Test thoroughly**
   - See `TESTING_GUIDE.md` for comprehensive testing checklist
   - Test on multiple Instagram profiles
   - Verify responsive layouts

### Project Structure

```
apps/sorted/
├── entrypoints/
│   ├── popup/           # Extension popup UI
│   │   ├── App.tsx      # Popup React component
│   │   └── main.tsx     # Popup entry point
│   ├── content/         # Instagram page content script
│   │   ├── index.tsx    # Main content script logic
│   │   └── style.css    # Content script styles
│   ├── background.ts    # Background service worker
│   └── interceptor.ts   # GraphQL response interceptor
├── public/
│   └── icon/           # Extension icons (16-128px)
├── scripts/
│   └── generate-icons.js  # Icon generation script
├── wxt.config.ts       # WXT configuration & manifest
├── package.json        # Dependencies & scripts
├── README.md          # This file
├── TESTING_GUIDE.md   # Comprehensive testing checklist
└── DESIGN_UPDATES.md  # Design system documentation
```

### Icon Generation

Icons are generated from the Delulu logo using Sharp:

```bash
pnpm generate-icons
```

This creates PNG icons at: 16px, 32px, 48px, 96px, 128px

---

## Architecture

### How It Works

1. **GraphQL Interception**
   - Intercepts Instagram's GraphQL responses using `interceptor.js`
   - Collects reel metadata (likes, views, comments, timestamps)
   - No external API calls - reads data Instagram already loads

2. **Content Script**
   - Injects sorting UI into Instagram's reels page
   - Manages reel grid manipulation and sorting logic
   - Handles loading states and user interactions

3. **Chrome Storage**
   - Stores user preferences (last sort type, quantity)
   - Caches reel data temporarily for quick re-sorts
   - All data stays local - nothing sent to external servers

4. **Popup Interface**
   - Detects when user is on Instagram reels tab
   - Provides quick access to sorting controls
   - Links to delulu.social for branding

---

## Privacy & Permissions

### Permissions Required

**storage**
- Saves your sorting preferences between sessions
- Stores last selected sort type and quantity
- Can be cleared via browser settings

**activeTab**
- Detects when you're on an Instagram reels tab
- Shows active/inactive state in popup
- No access to other tabs or browsing history

**host_permissions** (instagram.com)
- Reads reel metrics from Instagram page
- Required for GraphQL interception
- Cannot access other websites

### Data Collection

**We collect ZERO user data.**
- No analytics or tracking
- No personal information collected
- No data sent to external servers
- All processing happens locally in your browser

See our full [Privacy Policy](https://delulu.social/legal/extension/privacy) for details.

---

## Browser Compatibility

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome | ✅ Supported | Primary target (v120+) |
| Edge | ✅ Supported | Chromium-based |
| Brave | ✅ Supported | Chromium-based |
| Firefox | ❌ Not yet | Planned for v2.0 |
| Safari | ❌ Not planned | Different extension API |

---

## Roadmap

### Version 1.0.0 (Current)
- ✅ Sort by likes, views, comments, oldest
- ✅ Responsive grid layout (2-5 columns)
- ✅ Loading overlay with progress indicators
- ✅ Rank badges and metric display
- ✅ Chrome extension popup
- ✅ Reset to Instagram's original order

### Version 1.1.0 (Planned)
- [ ] Dark mode refinements
- [ ] Keyboard shortcuts (e.g., Ctrl+Shift+S to sort)
- [ ] Export functionality (CSV/JSON of sorted reels)
- [ ] Additional sorting options (engagement rate, save count)
- [ ] Performance optimizations for large accounts (500+ reels)

### Version 2.0.0 (Future)
- [ ] Firefox support
- [ ] Filter by date range
- [ ] Compare multiple profiles
- [ ] Historical data tracking (optional opt-in)

---

## Contributing

We welcome contributions from the community! Here's how you can help:

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/delulu/sorted/issues)
2. If not, create a new issue with:
   - Clear description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser version and OS
   - Screenshots if applicable

### Suggesting Features

1. Search existing [Issues](https://github.com/delulu/sorted/issues) for similar requests
2. Create a new issue with:
   - Detailed feature description
   - Use case explaining why it's valuable
   - Mockups or examples if possible

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following our code style (Biome)
4. Test thoroughly (see `TESTING_GUIDE.md`)
5. Commit with clear messages (`git commit -m 'Add amazing feature'`)
6. Push to your fork (`git push origin feature/amazing-feature`)
7. Open a Pull Request with detailed description

See `CONTRIBUTING.md` for detailed guidelines.

---

## FAQ

### Why do I need to navigate to a reels tab?

The extension only works on Instagram profile reels tabs because that's where reel grids are displayed. Instagram's home feed and explore pages use different layouts.

### How accurate are the metrics?

Metrics are 100% accurate - they're read directly from Instagram's own API responses. We don't estimate or approximate any data.

### Why does sorting take time for large accounts?

Instagram loads reels progressively as you scroll. To sort all reels, we need to scroll through the entire profile to collect all data. Accounts with 500+ reels may take 30-60 seconds.

### Can I use this on mobile?

This is a Chrome extension for desktop browsers. Mobile Chrome doesn't support extensions. We may create a mobile app in the future.

### Does this violate Instagram's terms of service?

We read publicly available data that Instagram already loads for you. No scraping, no unauthorized API access. However, Instagram's terms are subject to their interpretation.

### Will this work if Instagram changes their site?

The extension relies on Instagram's current page structure and GraphQL API. If Instagram makes changes, we'll update the extension accordingly. Report breakages via [Issues](https://github.com/delulu/sorted/issues).

---

## Support

Need help? Here's how to get support:

- 📚 Read the [TESTING_GUIDE.md](TESTING_GUIDE.md) for detailed usage instructions
- 🐛 Report bugs via [GitHub Issues](https://github.com/delulu/sorted/issues)
- 💬 Ask questions in [GitHub Discussions](https://github.com/delulu/sorted/discussions)
- 🌐 Visit [delulu.social](https://delulu.social) for general support
- 📧 Email: support@delulu.social

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

**TL;DR:** You can freely use, modify, and distribute this extension. Just include the original license.

---

## Acknowledgments

- Built with [WXT](https://wxt.dev/) - amazing extension framework
- Indigo branding inspired by Tailwind's indigo palette (#6366f1)
- Icons generated with [Sharp](https://sharp.pixelplumbing.com/)
- Part of the [Delulu Social](https://delulu.social) ecosystem

---

## Connect

- 🌐 Website: [delulu.social](https://delulu.social)
- 🐙 GitHub: [github.com/delulu/sorted](https://github.com/delulu/sorted)
- 🐦 Twitter: [@delulusocial](https://twitter.com/delulusocial)
- 📧 Email: hello@delulu.social

---

<div align="center">
  Made with ❤️ by the <a href="https://delulu.social">Delulu Social</a> team
  <br>
  <sub>Helping creators discover and analyze engaging social content</sub>
</div>
