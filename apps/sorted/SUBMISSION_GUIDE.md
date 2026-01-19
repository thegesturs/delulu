# Chrome Web Store Submission Guide

Quick, actionable guide to submit Sorted to Chrome Web Store.

---

## Prerequisites

Before you start:

- [x] Extension built (`pnpm build && pnpm zip`)
- [x] `.output/delulusorted-1.0.0-chrome.zip` exists (146 KB)
- [x] Testing completed (see TESTING_GUIDE.md)
- [x] Screenshots created (2-5 images, see MARKETING_ASSETS_GUIDE.md)
- [x] Privacy policy live at delulu.social/legal/extension-privacy
- [x] Google account ready
- [x] Credit card for $5 developer fee (one-time)

---

## Step 1: Create Developer Account (15 minutes)

1. Visit: https://chrome.google.com/webstore/devconsole
2. Sign in with Google account
3. Accept Developer Agreement
4. Pay $5 one-time registration fee
5. Wait for identity verification (can take 1-2 days)

**Note:** You can't submit until verification completes. Check email for confirmation.

---

## Step 2: Prepare Assets

### Required Files:
- [x] Extension package: `.output/delulusorted-1.0.0-chrome.zip`
- [x] Icon 128x128: `public/icon/128.png` (already in zip)
- [x] Screenshots: 2-5 images (640x400 or 1280x800)
  - Popup active state
  - Sorting controls
  - Sorted grid with badges
  - Metrics on hover
  - Loading state

### Optional (Recommended):
- [ ] Small promo tile: 440x280px
- [ ] Large promo tile: 1400x560px

---

## Step 3: Upload Extension (5 minutes)

In [Chrome Web Store Developer Console](https://chrome.google.com/webstore/devconsole):

1. Click **"New Item"** button
2. Upload `.output/delulusorted-1.0.0-chrome.zip`
3. Wait for validation (~30 seconds)
4. If errors appear, fix and re-upload

**Common upload errors:**
- Manifest errors: Check `wxt.config.ts`
- Missing icons: Ensure all icons in `public/icon/`
- Invalid permissions: Check manifest permissions

---

## Step 4: Fill Out Store Listing (20 minutes)

### Product Details Tab

**Product Name:**
```
Sorted - Instagram Reel Sorter
```

**Summary (132 char limit):**
```
Sort Instagram reels by likes, views, or comments. Find the most engaging content instantly with beautiful UI.
```

**Detailed Description:**
Copy from `STORE_LISTING.md` - it's already optimized and ready to paste.

**Category:**
- Primary: Social & Communication

**Language:**
- English (US)

---

### Graphics Tab

**Icon:**
- Automatically pulled from extension package ✅

**Screenshots (2-5 required):**
Upload screenshots in order:
1. `01-popup-active.png`
2. `02-sorting-controls.png`
3. `03-sorted-grid.png`
4. `04-metrics-hover.png`
5. `05-loading-state.png`

**Add captions for each:**
1. "Quick access from your toolbar"
2. "Choose your sorting metric and quantity"
3. "Reels ranked by engagement metrics"
4. "View detailed stats on hover"
5. "Smooth loading with progress indicators"

**Promotional Tiles (Optional):**
- Small: 440x280px
- Large: 1400x560px

---

### Privacy Practices Tab

**Single Purpose:**
```
Sorting Instagram reels by engagement metrics (likes, views, comments, or chronological order).
```

**Permission Justifications:**

**Storage:**
```
Saves user preferences for sorting options (sort type and quantity). No personal data stored.
```

**ActiveTab:**
```
Detects when user is on Instagram reels tab to show appropriate status in extension popup.
```

**Host Permissions (instagram.com):**
```
Required to access Instagram page content and read reel engagement metrics from GraphQL responses. All processing happens locally - no data transmitted externally.
```

**Data Usage:**
- [x] This extension does NOT collect user data

**Remote Code:**
- [x] This extension does NOT use remote code

**Privacy Policy URL:**
```
https://delulu.social/legal/extension-privacy
```

---

### Distribution Tab

**Visibility:**
- [x] Public

**Regions:**
- [x] All regions

**Pricing:**
- [x] Free

---

## Step 5: Submit for Review (5 minutes)

1. Review all tabs for completeness
2. Click **"Submit for Review"** at bottom
3. Confirm submission in popup dialog
4. Note submission ID for reference

**What happens next:**
- Review typically takes 1-3 days (sometimes up to 7 days)
- You'll receive email when review completes
- Extension goes live immediately upon approval

---

## Step 6: While Waiting for Review

**Do:**
- ✅ Monitor email for Chrome Web Store notifications
- ✅ Check developer console for status updates
- ✅ Prepare social media announcements
- ✅ Set up support@delulu.social email monitoring

**Don't:**
- ❌ Make changes to extension (wait for approval)
- ❌ Submit duplicate extensions
- ❌ Spam Chrome support asking for faster review

---

## Common Rejection Reasons & Fixes

### 1. Inadequate Privacy Policy
**Fix:** Ensure https://delulu.social/legal/extension-privacy is accessible and comprehensive

### 2. Unclear Permission Justifications
**Fix:** Add more detail in privacy tab explaining exactly why each permission is needed

### 3. Misleading Description
**Fix:** Remove any exaggerations, ensure accuracy

### 4. Poor Quality Screenshots
**Fix:** Use 1280x800 for better quality, show actual functionality

### 5. Single Purpose Violation
**Fix:** Remove any unrelated features, focus only on sorting reels

---

## If Rejected

1. **Read rejection email carefully** - note specific policy violations
2. **Fix issues** - update listing or code as needed
3. **Resubmit with explanation:**
   ```
   Thank you for the feedback. I've addressed the following issues:
   - [Issue 1]: [How you fixed it]
   - [Issue 2]: [How you fixed it]

   The extension now complies with all policies. Please review again.
   ```
4. **Wait for re-review** (usually faster, 1-2 days)

---

## If Approved

You'll receive email:
```
Subject: Your Chrome Web Store item "Sorted - Instagram Reel Sorter" has been published
```

**Next steps:**
1. Visit your extension's store page
2. Test installation from store (not unpacked)
3. Note extension ID for GitHub README
4. Announce launch! 🎉

---

## Post-Publication Checklist

See `POST_LAUNCH.md` for detailed post-publication tasks:
- Update README with store URL
- Create GitHub release
- Announce on social media
- Monitor reviews and respond
- Track metrics

---

## Important URLs

**Developer Console:** https://chrome.google.com/webstore/devconsole
**Support:** https://support.google.com/chrome_webstore/
**Policies:** https://developer.chrome.com/docs/webstore/program-policies
**Best Practices:** https://developer.chrome.com/docs/webstore/best-practices

---

## Quick Reference

### Character Limits
- Product name: 45 characters
- Summary: 132 characters
- Description: 16,000 characters
- Single purpose: 200 characters

### Image Requirements
- Icon: 128x128px (in package)
- Screenshots: 640x400 or 1280x800px, PNG/JPEG, 2-5 images
- Small promo: 440x280px (optional)
- Large promo: 1400x560px (optional)

### Review Timeline
- Initial: 1-3 days (up to 7 days)
- Resubmission: 1-2 days
- Updates: Hours to 1 day

---

**Ready to submit?** Follow this guide step-by-step and you'll be live in days!

Last Updated: January 19, 2026
