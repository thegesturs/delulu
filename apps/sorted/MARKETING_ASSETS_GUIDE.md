# Chrome Web Store Marketing Assets Guide

This guide provides step-by-step instructions for creating professional screenshots and promotional images for the Sorted extension's Chrome Web Store listing.

**Required by Chrome Web Store:** 2-5 screenshots (minimum)
**Optional but Recommended:** Small and large promotional tiles

---

## Table of Contents

1. [Screenshot Requirements](#screenshot-requirements)
2. [Screenshot Creation Guide](#screenshot-creation-guide)
3. [Promotional Image Guidelines](#promotional-image-guidelines)
4. [Tools and Resources](#tools-and-resources)
5. [Checklist](#final-checklist)

---

## Screenshot Requirements

### Technical Specifications

**Required Screenshots:** 2-5 images

**Dimensions:**
- **Option 1:** 1280x800px (16:10 ratio) - Recommended
- **Option 2:** 640x400px (16:10 ratio) - Acceptable

**Format:**
- PNG or JPEG
- Maximum 5 MB per file
- RGB color mode

**Quality:**
- High resolution (avoid pixelation)
- Clear text (readable at thumbnail size)
- Professional appearance
- Show actual extension functionality (no mockups)

### Screenshot Strategy

We recommend creating **5 screenshots** to maximize visibility and conversion:

1. **Extension Popup** (640x400px) - Show active state
2. **Sorting Controls** (1280x800px) - Interface overview
3. **Sorted Grid with Badges** (1280x800px) - Main feature showcase
4. **Metrics on Hover** (1280x800px) - Detail view
5. **Loading State** (640x400px) - User experience

---

## Screenshot Creation Guide

### Setup: Prepare Browser for Screenshots

1. **Install Extension**
   ```bash
   # Build production version
   pnpm build

   # Load unpacked in Chrome
   # Navigate to chrome://extensions/
   # Enable Developer mode
   # Load unpacked → select .output/chrome-mv3/
   ```

2. **Configure Chrome for Clean Screenshots**
   - Use a clean Chrome profile (no other extensions visible)
   - Hide bookmarks bar (Cmd/Ctrl + Shift + B)
   - Consider using Incognito mode for clean Instagram view
   - Ensure high-resolution display (Retina/HiDPI preferred)

3. **Test Instagram Account**
   - Use a profile with varied reel engagement (@instagram, @natgeo, @cristiano)
   - Ensure 50+ reels for realistic demo
   - Log in before taking screenshots

### Screenshot 1: Extension Popup (Active State)

**Dimensions:** 640x400px
**Purpose:** Show users what the extension popup looks like

**Steps:**

1. Navigate to Instagram profile reels tab (e.g., https://www.instagram.com/instagram/reels/)
2. Click the Sorted extension icon in Chrome toolbar
3. Popup should show "Ready to sort reels!" active state
4. Take screenshot of popup:
   - **macOS:** Cmd + Shift + 4, then Spacebar to capture window
   - **Windows:** Windows + Shift + S, select area

5. Crop/resize to exactly 640x400px:
   - **macOS:** Preview → Tools → Adjust Size
   - **Windows:** Paint or Photos app
   - **Cross-platform:** Use online tool like [Canva](https://www.canva.com)

6. **Elements to show:**
   - Extension icon at top
   - "Ready to sort reels!" message
   - Indigo accent bar
   - "by delulu.social" branding
   - Clean, centered composition

7. Save as: `assets/store-screenshots/01-popup-active.png`

**Example Caption for Store:** "Quick access from your toolbar"

---

### Screenshot 2: Sorting Controls Interface

**Dimensions:** 1280x800px
**Purpose:** Show the sorting control panel and dropdown menus

**Steps:**

1. Navigate to Instagram profile reels tab
2. Ensure extension's sorting panel is visible above reels grid
3. Click on "Sort by" dropdown to show options:
   - Most Liked
   - Most Viewed
   - Most Commented
   - Oldest
4. Position browser window for clean capture
5. Use Chrome DevTools device toolbar to set exact size:
   - Open DevTools (F12)
   - Click device toolbar icon (or Cmd/Ctrl + Shift + M)
   - Set "Responsive" mode
   - Enter dimensions: 1280x800px
   - Zoom to 100%

6. Take screenshot:
   - Click camera icon in DevTools device toolbar
   - Or use macOS/Windows screenshot tools and crop

7. **Elements to show:**
   - Sorting dropdown menu (expanded)
   - Quantity selector (25, 50, All)
   - "Sort Reels" button with indigo color
   - "Reset" button
   - Part of Instagram's reels grid below
   - Clean, professional layout

8. Save as: `assets/store-screenshots/02-sorting-controls.png`

**Example Caption for Store:** "Choose your sorting metric and quantity"

---

### Screenshot 3: Sorted Grid with Rank Badges

**Dimensions:** 1280x800px
**Purpose:** Showcase the main feature - sorted reels with rank badges

**Steps:**

1. Navigate to Instagram profile reels tab
2. Use extension to sort reels (e.g., "Most Liked", 50 reels)
3. Wait for sorting to complete
4. Scroll to show first 15-20 reels with rank badges
5. Set browser viewport to 1280x800px using DevTools device toolbar
6. Take screenshot showing:
   - Rank badges (#1, #2, #3...) with indigo background
   - Clean grid layout (4-5 columns)
   - Reel thumbnails
   - Part of sorting controls at top

7. **Pro tip:** Use browser zoom (90-100%) to fit more reels while keeping clarity

8. Save as: `assets/store-screenshots/03-sorted-grid.png`

**Example Caption for Store:** "Reels sorted by engagement with rank badges"

---

### Screenshot 4: Metrics on Hover

**Dimensions:** 1280x800px
**Purpose:** Show detailed metrics overlay when hovering over reels

**Steps:**

1. While viewing sorted reels grid, hover over a reel card
2. Metrics container should appear showing:
   - Likes count
   - Views count
   - Comments count
   - Monospace font formatting

3. Position so the metrics overlay is clearly visible
4. Consider annotating the screenshot:
   - Add a subtle arrow or indicator showing the hover action
   - Or use a cursor capture tool to show mouse hover

5. Take screenshot with metrics visible on 2-3 reel cards
6. Set viewport to 1280x800px

7. Save as: `assets/store-screenshots/04-metrics-hover.png`

**Example Caption for Store:** "View detailed engagement metrics at a glance"

---

### Screenshot 5: Loading State Animation

**Dimensions:** 640x400px
**Purpose:** Show the beautiful loading overlay during sorting

**Steps:**

1. Navigate to Instagram profile reels tab
2. Click "Sort Reels" to start sorting
3. Quickly capture the loading overlay:
   - Indigo vignette effect
   - Triple-ring spinner animation
   - Progress message ("Scrolling to collect reels..." or "Scroll 1/3")
   - Backdrop blur effect

4. **Timing tip:** May need several attempts to capture the perfect moment
   - Use a profile with many reels (100+) for longer loading time
   - Or use browser console to artificially slow down sorting (debugging)

5. Crop to 640x400px centered on the loading overlay

6. Save as: `assets/store-screenshots/05-loading-state.png`

**Example Caption for Store:** "Smooth loading experience with progress indicators"

---

### Screenshot Quality Tips

**Do's:**
- ✅ Use high-resolution display (Retina/HiDPI)
- ✅ Capture at 100% browser zoom for sharpness
- ✅ Show actual functionality (no mockups)
- ✅ Use clean Instagram profiles with good content
- ✅ Ensure consistent lighting/brightness
- ✅ Verify indigo branding is visible

**Don'ts:**
- ❌ Don't show personal information (your Instagram account)
- ❌ Don't include browser UI clutter (bookmarks, extensions)
- ❌ Don't use low-resolution or pixelated images
- ❌ Don't show error states or bugs
- ❌ Don't add excessive text overlays
- ❌ Don't show inappropriate content

---

## Promotional Image Guidelines

**Optional but Recommended** - Improves store listing visibility and conversion rate

### Small Promotional Tile

**Dimensions:** 440x280px (PNG or JPEG)
**Purpose:** Appears in Chrome Web Store search results and category listings

**Design Elements:**

1. **Background:**
   - Indigo gradient (#6366f1 to darker shade)
   - Or white background with indigo accents

2. **Icon:**
   - Extension icon (128px version) prominently displayed
   - Positioned left or center

3. **Text:**
   - "Sorted" (large, bold)
   - "Instagram Reel Sorter" (subtitle)
   - Or: "Sort Reels by Engagement" (benefit-focused)

4. **Branding:**
   - Use DM Sans font (matches extension)
   - Indigo color scheme
   - Delulu logo/watermark (subtle)

**Creation Tools:**
- **Canva:** [canva.com](https://www.canva.com) - Use "Custom dimensions" 440x280px
- **Figma:** [figma.com](https://www.figma.com) - Free design tool
- **Photoshop/Illustrator:** If you have Adobe CC

**Design Template (Canva):**
```
- Background: Indigo gradient (#6366f1)
- Icon: Sorted logo (centered-left, 120px)
- Text:
  - "Sorted" (48px, bold, white)
  - "Instagram Reel Sorter" (18px, white, opacity 80%)
- Layout: Icon left, text right
- Export as PNG (2x resolution for sharpness)
```

**Save as:** `assets/store-promo/small-promo-tile.png`

---

### Large Promotional Tile

**Dimensions:** 1400x560px (PNG or JPEG)
**Purpose:** Featured placement on Chrome Web Store homepage (if selected)

**Design Elements:**

1. **Background:**
   - Indigo gradient or abstract pattern
   - Instagram-style imagery (grid of reels)
   - Modern, professional aesthetic

2. **Hero Section:**
   - Extension icon (large, 200px+)
   - Feature highlights
   - Call-to-action ("Sort Instagram Reels")

3. **Text:**
   - "Sorted - Instagram Reel Sorter" (large headline)
   - "Find the most engaging reels instantly" (subheadline)
   - Key features (3-4 bullet points with icons)

4. **Visual Elements:**
   - Screenshot composite showing before/after
   - Rank badge mockups
   - Indigo accent colors throughout

**Feature Highlights (Icons + Text):**
- 🎯 Multiple sorting options
- 📊 Detailed metrics
- ⚡ Fast & efficient
- 🔒 Privacy-focused

**Design Template (Figma/Canva):**
```
- Left side (40%): Hero text + features
- Right side (60%): Screenshot composite
- Background: Gradient or blurred Instagram imagery
- Color scheme: Indigo (#6366f1), white, gray
- Typography: DM Sans (headings), Inter (body)
```

**Save as:** `assets/store-promo/large-promo-tile.png`

---

### Marquee Promotional Tile (Optional)

**Dimensions:** 1400x560px (PNG or JPEG)
**Purpose:** Rare - only if Chrome editors feature the extension

**Design:** Similar to large promotional tile but more polished
- Higher production value
- Professional copywriting
- Editorial-quality imagery

**Note:** Only create if Chrome Web Store explicitly requests it

---

## Tools and Resources

### Screenshot Capture Tools

**macOS:**
- Built-in: Cmd + Shift + 4 (area), Cmd + Shift + 4 + Spacebar (window)
- [CleanShot X](https://cleanshot.com) - Advanced screenshot tool ($29)
- [Shottr](https://shottr.cc) - Free, lightweight

**Windows:**
- Built-in: Windows + Shift + S (Snip & Sketch)
- [Greenshot](https://getgreenshot.org) - Free, open source
- [ShareX](https://getsharex.com) - Free, feature-rich

**Cross-Platform:**
- Chrome DevTools device toolbar (built-in)
- [Awesome Screenshot](https://www.awesomescreenshot.com) - Browser extension
- [Nimbus Screenshot](https://nimbusweb.me) - Browser extension

### Image Editing Tools

**Free:**
- [Canva](https://www.canva.com) - Online, templates
- [Figma](https://www.figma.com) - Professional design tool
- [GIMP](https://www.gimp.org) - Open source Photoshop alternative
- [Photopea](https://www.photopea.com) - Online Photoshop clone

**Paid:**
- Adobe Photoshop - Industry standard ($10/month)
- Adobe Illustrator - Vector graphics ($21/month)
- Sketch - macOS only ($99/year)

### Resize & Optimization

**Online Tools:**
- [TinyPNG](https://tinypng.com) - Compress PNG files
- [Squoosh](https://squoosh.app) - Google's image optimizer
- [ResizeImage.net](https://resizeimage.net) - Batch resize

**Command Line (Advanced):**
```bash
# Install ImageMagick
brew install imagemagick  # macOS
sudo apt-get install imagemagick  # Linux

# Resize images
convert input.png -resize 1280x800 output.png

# Compress PNG
pngquant input.png --output output.png
```

### Design Resources

**Icons:**
- [Heroicons](https://heroicons.com) - Free, MIT license
- [Lucide](https://lucide.dev) - Free, open source
- [Font Awesome](https://fontawesome.com) - Free tier available

**Fonts:**
- [DM Sans](https://fonts.google.com/specimen/DM+Sans) - Used in extension
- [Inter](https://fonts.google.com/specimen/Inter) - Great for body text
- [Roboto Mono](https://fonts.google.com/specimen/Roboto+Mono) - Metrics font

**Colors:**
- **Primary Indigo:** #6366f1
- **Dark Indigo:** #4f46e5
- **Light Indigo:** #818cf8
- **Background:** #ffffff (white) or #f9fafb (gray)
- **Text:** #111827 (dark gray)

---

## Best Practices

### Visual Consistency

- Use the same Instagram profile across screenshots
- Maintain consistent browser viewport size
- Match color profiles (sRGB)
- Use same font sizes and spacing
- Keep indigo branding visible

### Storytelling

Order screenshots to tell a story:
1. **Discover** - Extension popup
2. **Configure** - Sorting controls
3. **Experience** - Loading state
4. **Result** - Sorted grid
5. **Detail** - Metrics hover

### Mobile Optimization

Chrome Web Store shows screenshot thumbnails on mobile:
- Ensure text is readable at small sizes
- Use high contrast
- Avoid tiny details
- Test thumbnail preview (200px wide)

### A/B Testing (Post-Launch)

After launch, consider:
- Testing different screenshot orders
- Adding captions or annotations
- Updating screenshots with new features
- Seasonal variations (holidays, events)

---

## File Naming Convention

**Screenshots:**
- `01-popup-active.png` (640x400px)
- `02-sorting-controls.png` (1280x800px)
- `03-sorted-grid.png` (1280x800px)
- `04-metrics-hover.png` (1280x800px)
- `05-loading-state.png` (640x400px)

**Promotional Tiles:**
- `small-promo-tile.png` (440x280px)
- `large-promo-tile.png` (1400x560px)
- `marquee-promo-tile.png` (1400x560px, if needed)

**Backup/Versions:**
- `01-popup-active-v2.png`
- `03-sorted-grid-alternate.png`

---

## Quality Checklist

Before uploading to Chrome Web Store:

### Screenshots
- [ ] Exactly 1280x800px or 640x400px dimensions
- [ ] PNG or JPEG format, under 5 MB each
- [ ] At least 2 screenshots (recommend 5)
- [ ] Show actual extension functionality
- [ ] No personal information visible
- [ ] Clean browser UI (no clutter)
- [ ] High resolution (no pixelation)
- [ ] Indigo branding visible
- [ ] Text is readable at thumbnail size
- [ ] Consistent styling across all screenshots

### Promotional Tiles (Optional)
- [ ] Small tile: 440x280px
- [ ] Large tile: 1400x560px
- [ ] Professional design quality
- [ ] Clear value proposition
- [ ] Brand consistency (indigo colors, DM Sans font)
- [ ] High resolution (no pixelation)
- [ ] Text is readable
- [ ] Icon prominently displayed

### Final Verification
- [ ] All files saved in `assets/store-screenshots/` directory
- [ ] Promo tiles saved in `assets/store-promo/` directory
- [ ] File names follow convention
- [ ] Backup copies created
- [ ] Tested viewing at Chrome Web Store thumbnail size
- [ ] Reviewed by team member (if available)

---

## Example Screenshot Captions

When uploading to Chrome Web Store, you can add captions to screenshots. Here are suggested captions:

1. **Popup:** "Quick access from your browser toolbar"
2. **Controls:** "Choose your sorting metric and quantity"
3. **Sorted Grid:** "Reels ranked by engagement metrics"
4. **Metrics:** "View detailed stats on hover"
5. **Loading:** "Smooth loading with progress indicators"

**Caption Best Practices:**
- Keep under 50 characters
- Describe the benefit, not just the feature
- Use active voice
- No ALL CAPS
- No excessive punctuation!!!

---

## Timeline

**Time to create all assets:** 2-3 hours

**Breakdown:**
- Setup and testing: 30 minutes
- Screenshot 1 (Popup): 15 minutes
- Screenshot 2 (Controls): 20 minutes
- Screenshot 3 (Sorted Grid): 20 minutes
- Screenshot 4 (Metrics): 20 minutes
- Screenshot 5 (Loading): 15 minutes
- Small Promo Tile: 30 minutes
- Large Promo Tile: 45 minutes
- Review and optimization: 15 minutes

**Pro tip:** Set aside a focused 3-hour block to create all assets at once for consistency.

---

## Troubleshooting

**Problem:** Screenshots look blurry or pixelated
- **Solution:** Ensure you're capturing at 100% browser zoom on a high-DPI display

**Problem:** Extension UI isn't showing correctly
- **Solution:** Reload extension in chrome://extensions/, refresh Instagram page

**Problem:** Can't capture loading state (too fast)
- **Solution:** Test on a profile with 200+ reels, or slow down sorting using browser console

**Problem:** Instagram reels not loading
- **Solution:** Check internet connection, try different profile, clear cache

**Problem:** DevTools device toolbar not showing exact dimensions
- **Solution:** Set "Responsive" mode, manually type 1280x800 in dimension fields

**Problem:** File size too large (>5 MB)
- **Solution:** Use TinyPNG or Squoosh to compress, or save as JPEG with 85% quality

---

## Post-Creation Checklist

After creating all assets:

1. **Review Quality**
   - View screenshots on different devices (desktop, mobile)
   - Zoom in to check clarity
   - Compare with competitor extensions' screenshots

2. **Peer Review**
   - Have team member review for feedback
   - Check for typos or inconsistencies
   - Verify branding alignment

3. **Backup**
   - Copy assets to cloud storage (Google Drive, Dropbox)
   - Version control (git commit) if in repository
   - Keep source files (PSD, Figma) for future updates

4. **Prepare for Upload**
   - Organize files in correct order
   - Write captions for each screenshot
   - Have store listing copy ready (see STORE_LISTING.md)

---

## Final Notes

**Screenshots are critical** for Chrome Web Store conversion:
- Users browse extensions visually
- Good screenshots can 2-3x your install rate
- Professional quality signals trustworthiness

**Invest the time** to create high-quality assets. It's worth it!

---

**Need Help?**

- Check Chrome Web Store's [official screenshot guidelines](https://developer.chrome.com/docs/webstore/images/)
- Review competitor extensions' screenshots for inspiration
- Use design tools' templates and tutorials
- Consider hiring a designer on Fiverr or Upwork ($20-50)

---

<div align="center">
  <p><strong>Ready to create amazing marketing assets!</strong></p>
  <p>Last Updated: January 19, 2026</p>
</div>
