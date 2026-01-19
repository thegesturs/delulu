# Sorted - Instagram Reel Sorter Testing Guide

## Overview
This guide provides step-by-step instructions for testing the Sorted extension before Chrome Web Store publication. Complete all checklist items to ensure the extension meets quality standards.

## Setup: Load Extension in Chrome

### Step 1: Build Production Version
The extension has already been built. You should see:
- ✅ `.output/chrome-mv3/` directory exists
- ✅ `manifest.json` is generated
- ✅ All icons present (16, 32, 48, 96, 128px)
- ✅ `.output/delulusorted-1.0.0-chrome.zip` created (146 KB)

### Step 2: Load Unpacked Extension
1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle switch in top-right corner)
4. Click **"Load unpacked"** button
5. Navigate to and select: `/Users/whizzy/Developer/startups/gesturs/delulu/apps/sorted/.output/chrome-mv3/`
6. The extension should now appear in your extensions list

### Step 3: Pin Extension to Toolbar
1. Click the puzzle icon in Chrome toolbar (Extensions)
2. Find "Sorted - Instagram Reel Sorter"
3. Click the pin icon to pin it to your toolbar for easy access

---

## Testing Checklist

### 1. Popup Testing

#### Test 1.1: Open Extension Popup
- [ ] Click the Sorted extension icon in Chrome toolbar
- [ ] Verify popup opens immediately
- [ ] Check popup dimensions are appropriate (not too small/large)

#### Test 1.2: Branding & Links
- [ ] Verify "by delulu.social" text is visible at bottom of popup
- [ ] Click "delulu.social" link
- [ ] Confirm it opens https://delulu.social in new tab

#### Test 1.3: Active State (Instagram Reels Tab)
- [ ] Navigate to any Instagram profile (e.g., https://www.instagram.com/instagram/)
- [ ] Click on the **Reels** tab (grid of video thumbnails)
- [ ] Open extension popup
- [ ] Verify message shows: "Ready to sort reels!" or similar active state
- [ ] Check that indigo accent bar is visible
- [ ] Verify "Sort Reels" button is enabled

#### Test 1.4: Inactive State (Other Pages)
- [ ] Navigate to Instagram home feed (https://www.instagram.com/)
- [ ] Open extension popup
- [ ] Verify message shows: "Navigate to a profile's reels tab" or similar
- [ ] Check that "Sort Reels" button is disabled or not shown
- [ ] Test on non-Instagram page (e.g., google.com)
- [ ] Verify extension shows inactive/unavailable state

#### Test 1.5: Typography & Styling
- [ ] Check that DM Sans font is loaded (popup should not use system font)
- [ ] Verify indigo colors match branding (#6366f1)
- [ ] Check spacing and padding are consistent
- [ ] Verify hover states on links and buttons work

---

### 2. Loading Overlay Testing

#### Test 2.1: Basic Loading Overlay
- [ ] Navigate to Instagram profile reels tab with 20+ reels
- [ ] Click "Sort Reels" button (or activate sorting)
- [ ] Verify loading overlay appears immediately
- [ ] Check that indigo vignette effect is visible around edges
- [ ] Confirm backdrop blur effect is applied to Instagram content

#### Test 2.2: Spinner Animation
- [ ] During loading, verify triple-ring spinner is visible
- [ ] Check that spinner has smooth rotation animation
- [ ] Confirm spinner is centered in viewport
- [ ] Verify indigo color (#6366f1) is used for spinner rings

#### Test 2.3: Progress Messages
- [ ] Verify initial message: "Scrolling to collect reels..." or similar
- [ ] Watch for progress updates: "Scroll 1/3", "Scroll 2/3", etc.
- [ ] Check that final message shows before overlay disappears
- [ ] Confirm messages are centered and readable

#### Test 2.4: Animations
- [ ] Check smooth fade-in when overlay appears
- [ ] Verify smooth fade-out when sorting completes
- [ ] Confirm no flickering or jarring transitions
- [ ] Test that overlay completely disappears after sorting

---

### 3. Sorted Grid Testing

#### Test 3.1: Sorting by "Most Liked"
- [ ] Navigate to profile with varied reel engagement (e.g., @instagram)
- [ ] Select "Most Liked" from sorting dropdown
- [ ] Click "Sort Reels"
- [ ] Verify reels are ordered from highest to lowest likes
- [ ] Check first 5 reels manually to confirm sorting accuracy
- [ ] Verify rank badges show "1", "2", "3", etc. in top-left corners

#### Test 3.2: Sorting by "Most Viewed"
- [ ] Select "Most Viewed" from dropdown
- [ ] Click "Sort Reels"
- [ ] Verify reels are ordered by view count (highest first)
- [ ] Check that views metric is displayed correctly
- [ ] Compare with Instagram's native view counts for accuracy

#### Test 3.3: Sorting by "Most Commented"
- [ ] Select "Most Commented" from dropdown
- [ ] Click "Sort Reels"
- [ ] Verify reels are ordered by comment count
- [ ] Check that comment numbers match Instagram's data
- [ ] Verify reels with 0 comments are at the end

#### Test 3.4: Sorting by "Oldest"
- [ ] Select "Oldest" from dropdown
- [ ] Click "Sort Reels"
- [ ] Verify reels are ordered chronologically (oldest first)
- [ ] Check that oldest reels appear at top of grid
- [ ] Confirm this is reverse of Instagram's default order

#### Test 3.5: Reel Quantity Limits
- [ ] Test with "25 reels" limit - verify only 25 reels shown
- [ ] Test with "50 reels" limit - verify only 50 reels shown
- [ ] Test with "All" option - verify all available reels are sorted
- [ ] On profile with 100+ reels, confirm "All" processes everything
- [ ] Check loading times remain acceptable for "All" option

#### Test 3.6: Rank Badges
- [ ] Verify rank badges have indigo background (#6366f1)
- [ ] Check white text on badges is readable
- [ ] Confirm badges are positioned in top-left corner of each reel
- [ ] Verify badges don't obscure important reel content
- [ ] Check badges scale properly with reel cards

#### Test 3.7: Metrics Display
- [ ] Hover over a reel card
- [ ] Verify metric container appears with likes, views, comments
- [ ] Check that numbers use monospace font (Roboto Mono or similar)
- [ ] Verify metrics are formatted correctly (K, M for thousands/millions)
- [ ] Confirm metrics container has proper background/contrast
- [ ] Test on multiple reels to ensure consistency

#### Test 3.8: Responsive Grid Layout
Open Chrome DevTools (F12) and test different screen sizes:

- [ ] **5 columns (1400px+)**: Desktop monitors
  - Set viewport to 1920x1080
  - Verify 5 columns of reels display
  - Check spacing between columns is even

- [ ] **4 columns (1024-1400px)**: Laptop screens
  - Set viewport to 1280x720
  - Verify 4 columns display
  - Check layout doesn't break

- [ ] **3 columns (768-1024px)**: Tablets
  - Set viewport to 800x600
  - Verify 3 columns display
  - Check cards remain proportional

- [ ] **2 columns (<768px)**: Mobile devices
  - Set viewport to 375x667 (iPhone size)
  - Verify 2 columns display
  - Check touch targets are adequate
  - Test scrolling on mobile viewport

---

### 4. Controls Testing

#### Test 4.1: Sorting Dropdown
- [ ] Click sorting dropdown (Most Liked, Most Viewed, etc.)
- [ ] Verify all 4 options are present
- [ ] Check indigo color on selected option
- [ ] Test keyboard navigation (arrow keys to navigate, Enter to select)
- [ ] Verify dropdown closes after selection

#### Test 4.2: Quantity Dropdown
- [ ] Click quantity dropdown (25, 50, All)
- [ ] Verify all 3 options are present
- [ ] Test changing quantity and re-sorting
- [ ] Check that selection persists between sorts

#### Test 4.3: Button States
- [ ] Verify "Sort Reels" button has indigo background (#6366f1)
- [ ] Check hover state (darker indigo or visual feedback)
- [ ] Test focus state (indigo ring on keyboard focus)
- [ ] During sorting, verify button is disabled or shows loading state
- [ ] After sorting, verify button returns to normal state

#### Test 4.4: Reset Button
- [ ] After sorting reels, click "Reset" button
- [ ] Verify Instagram's original grid order returns immediately
- [ ] Check that all sorted indicators disappear (rank badges, metrics)
- [ ] Confirm Instagram's native UI is fully restored
- [ ] Test sorting again after reset works correctly

#### Test 4.5: Keyboard Navigation
- [ ] Tab through all controls in sorting panel
- [ ] Verify focus indicators (indigo rings) are visible
- [ ] Press Enter on "Sort Reels" button - verify sorting starts
- [ ] Press Enter on "Reset" button - verify reset works
- [ ] Test Escape key behavior (should close dropdowns)

#### Test 4.6: Mobile Responsiveness
In mobile viewport (375px width):
- [ ] Verify dropdowns are touch-friendly (adequate tap targets)
- [ ] Check buttons don't overlap or break layout
- [ ] Test that sorting panel fits within screen width
- [ ] Verify text remains readable (no font size too small)

---

### 5. Error Handling Testing

#### Test 5.1: Non-Reels Instagram Pages
- [ ] Navigate to Instagram home feed
- [ ] Try activating extension - verify no errors in console
- [ ] Navigate to Instagram explore page
- [ ] Verify extension handles gracefully (shows inactive state)
- [ ] Test on Instagram Stories page - confirm no interference

#### Test 5.2: Slow Internet Connection
- [ ] Open Chrome DevTools (F12) → Network tab
- [ ] Set throttling to "Slow 3G"
- [ ] Navigate to profile reels tab
- [ ] Click "Sort Reels"
- [ ] Verify loading overlay shows progress appropriately
- [ ] Check that extension doesn't timeout or crash
- [ ] Confirm reels eventually load and sort correctly

#### Test 5.3: Navigate Away During Sorting
- [ ] Start sorting reels (click "Sort Reels")
- [ ] While loading overlay is visible, navigate to different page
- [ ] Check console for errors (F12 → Console tab)
- [ ] Return to reels tab
- [ ] Verify extension state recovers correctly

#### Test 5.4: Private/Restricted Profiles
- [ ] Find a private Instagram profile (you're not following)
- [ ] Navigate to their profile
- [ ] Verify extension doesn't crash when no reels are accessible
- [ ] Check console for errors
- [ ] Test with restricted accounts (shadowbanned, etc.)

#### Test 5.5: Console Errors
Throughout all tests:
- [ ] Keep Chrome DevTools console open (F12 → Console)
- [ ] Monitor for any errors (red text)
- [ ] Note any warnings (yellow text) - investigate if critical
- [ ] Verify no uncaught exceptions during normal operation

---

### 6. Performance Testing

#### Test 6.1: Large Accounts (100+ Reels)
- [ ] Find profile with 100+ reels (e.g., @instagram, @cristiano)
- [ ] Select "All" reels option
- [ ] Click "Sort Reels"
- [ ] Monitor loading time (should complete in <30 seconds)
- [ ] Verify extension doesn't freeze browser
- [ ] Check that UI remains responsive during sorting

#### Test 6.2: Memory Usage
- [ ] Open Chrome Task Manager (⋮ menu → More tools → Task Manager)
- [ ] Note baseline memory usage of Instagram tab
- [ ] Activate sorting with "All" reels
- [ ] Monitor memory usage during sorting
- [ ] Verify memory returns to normal after sorting completes
- [ ] Check for memory leaks (repeated sorts shouldn't increase memory)

#### Test 6.3: Console Performance
- [ ] Open Chrome DevTools → Console
- [ ] Look for performance warnings
- [ ] Check for excessive console logging (should be minimal in production)
- [ ] Verify no repeated error messages

#### Test 6.4: Smooth Scrolling
- [ ] During sorting, observe Instagram page scrolling
- [ ] Verify scrolling is smooth (not janky or stuttering)
- [ ] Check that loading overlay doesn't impact scroll performance
- [ ] Confirm page remains usable after sorting completes

---

### 7. Cross-Browser Testing (Chromium-based)

#### Test 7.1: Microsoft Edge
If you have Microsoft Edge installed:
- [ ] Navigate to `edge://extensions/`
- [ ] Enable Developer mode
- [ ] Load unpacked extension from same `.output/chrome-mv3/` folder
- [ ] Run key tests from Sections 1-5
- [ ] Verify all functionality works identically to Chrome

#### Test 7.2: Brave Browser
If you have Brave installed:
- [ ] Navigate to `brave://extensions/`
- [ ] Enable Developer mode
- [ ] Load unpacked extension
- [ ] Run key tests from Sections 1-5
- [ ] Check for any Brave-specific issues (shields, privacy features)

---

## Known Issues & Limitations

Document any issues discovered during testing:

### Critical Issues (must fix before publication)
- [ ] None found

### Minor Issues (can address in v1.1.0)
- [ ] (Document any non-critical issues here)

### Limitations (by design)
- Extension requires Instagram's GraphQL API responses (may break if Instagram changes API)
- Sorting accuracy depends on Instagram's metric data availability
- Large accounts (500+ reels) may take 30-60 seconds to sort completely

---

## Final Verification Checklist

Before proceeding to Chrome Web Store submission:

- [ ] All critical tests passed
- [ ] No console errors during normal operation
- [ ] Extension works on at least 3 different Instagram profiles
- [ ] Performance is acceptable for large accounts (100+ reels)
- [ ] UI is responsive and looks professional
- [ ] Indigo branding (#6366f1) is consistent throughout
- [ ] Extension popup shows correct active/inactive states
- [ ] Reset button properly restores Instagram's original grid
- [ ] No memory leaks or performance degradation after multiple uses

---

## Next Steps

Once testing is complete:
1. ✅ Mark this testing phase as complete
2. → Proceed to Phase 2: Documentation & Compliance
3. → Create Chrome Web Store marketing assets
4. → Submit to Chrome Web Store for review

---

## Console Error Reference

If you encounter errors during testing, check for these common issues:

**"Cannot read property of undefined"**
- Instagram page structure may have changed
- Check if reels are actually loaded on page

**"Failed to fetch"**
- Network issue or Instagram API blocking
- Try refreshing page and retrying

**"Extension context invalidated"**
- Extension was reloaded/updated during use
- Reload Chrome extension and refresh Instagram page

**"Permissions error"**
- Check manifest.json includes correct host_permissions
- Verify extension has access to instagram.com

---

## Support

If you encounter issues during testing:
1. Check console for error messages (F12 → Console)
2. Review Instagram page structure (may have changed)
3. Verify extension has latest build (`pnpm build`)
4. Try uninstalling and reinstalling extension

---

**Last Updated:** January 19, 2026
**Extension Version:** 1.0.0
**Testing Status:** ⏳ Awaiting user testing
