# Sorted Extension - Launch Roadmap

**Quick reference guide to get Sorted published on Chrome Web Store**

---

## Current Status

✅ **Extension Ready:**
- Production build created: `.output/delulusorted-1.0.0-chrome.zip` (146 KB)
- All icons generated (16px to 128px)
- Manifest V3 compliant
- Zero console errors

✅ **Documentation Complete:**
- Comprehensive README.md
- Testing guide with full checklist
- Privacy policy page ready
- Store listing copy prepared
- Open source license (MIT)

---

## What You Need to Do Next

### Phase 1: Testing (2-3 hours)

**Before submitting, test everything:**

1. **Load extension in Chrome:**
   - Navigate to `chrome://extensions/`
   - Enable Developer mode
   - Load unpacked from `.output/chrome-mv3/`

2. **Run through TESTING_GUIDE.md checklist:**
   - Test popup (active/inactive states)
   - Test sorting (all 4 metrics: likes, views, comments, oldest)
   - Test loading overlay
   - Test responsive layouts (mobile, tablet, desktop)
   - Check for console errors

3. **Test on multiple Instagram profiles:**
   - @instagram (official account)
   - @natgeo (large account with varied content)
   - Your own account (if you have one)

**If you find bugs:** Fix before proceeding to Phase 2.

---

### Phase 2: Create Marketing Assets (2-3 hours)

**Required: 2-5 screenshots for Chrome Web Store**

Follow `MARKETING_ASSETS_GUIDE.md` to create:

1. **Screenshot 1:** Extension popup (640x400px)
2. **Screenshot 2:** Sorting controls (1280x800px)
3. **Screenshot 3:** Sorted grid with badges (1280x800px)
4. **Screenshot 4:** Metrics on hover (1280x800px)
5. **Screenshot 5:** Loading state (640x400px)

**Optional but recommended:**
- Small promotional tile (440x280px)
- Large promotional tile (1400x560px)

**Save to:** `assets/store-screenshots/`

**Tools:**
- Use Chrome DevTools device toolbar for exact dimensions
- Edit with Canva, Photoshop, or Preview/Paint

---

### Phase 3: Publish Privacy Policy (15 minutes)

**Deploy the privacy policy page:**

The file is already created at:
```
apps/web/data/legal/extension-privacy.mdx
```

**Deploy the web app:**
```bash
# From monorepo root
cd apps/web
pnpm build
pnpm deploy  # or your deployment command
```

**Verify it's live:**
- Visit: https://delulu.social/legal/extension-privacy
- Should show full privacy policy
- Must be accessible before Chrome Web Store submission

---

### Phase 4: Chrome Web Store Submission (30-45 minutes)

**Follow SUBMISSION_GUIDE.md step-by-step:**

1. **Create developer account** (if you don't have one)
   - Visit: https://chrome.google.com/webstore/devconsole
   - Pay $5 one-time fee
   - Wait for verification (1-2 days)

2. **Upload extension package**
   - Upload `.output/delulusorted-1.0.0-chrome.zip`
   - Wait for validation

3. **Fill out store listing**
   - Copy text from `STORE_LISTING.md` (already written for you)
   - Upload screenshots
   - Add permission justifications
   - Enter privacy policy URL

4. **Submit for review**
   - Click "Submit for Review"
   - Wait 1-7 days for approval

**All the copy is ready** - just paste from STORE_LISTING.md!

---

### Phase 5: While Waiting for Review (1-3 days)

**Do:**
- ✅ Monitor email for Chrome Web Store notifications
- ✅ Prepare social media posts for launch announcement
- ✅ Set up support@delulu.social email monitoring
- ✅ Plan v1.1.0 features

**Don't:**
- ❌ Make changes to the extension
- ❌ Submit to other stores yet
- ❌ Spam Chrome support

---

### Phase 6: Post-Publication (Day 1 after approval)

**Follow POST_LAUNCH.md:**

1. **Update documentation:**
   - Add Chrome Web Store URL to README
   - Add extension ID to badges
   - Create GitHub release (v1.0.0)

2. **Test live installation:**
   - Install from Chrome Web Store (not unpacked)
   - Verify everything works

3. **Announce launch:**
   - Post on Twitter/X
   - Post on LinkedIn
   - Email Delulu Social users
   - Write blog post

4. **Monitor closely:**
   - Respond to reviews within 48 hours
   - Fix critical bugs immediately
   - Track install/uninstall metrics

---

## Timeline Summary

| Phase | Time Required | When |
|-------|--------------|------|
| **Testing** | 2-3 hours | Now |
| **Screenshots** | 2-3 hours | After testing passes |
| **Privacy Policy** | 15 minutes | Before submission |
| **Submission** | 45 minutes | After screenshots ready |
| **Review Wait** | 1-7 days | Automatic |
| **Post-Launch** | 1 hour | Day 1 after approval |

**Total active time:** ~6-8 hours
**Total calendar time:** 2-10 days (including Chrome review)

---

## File Reference

**Essential files you'll need:**

| File | Purpose | Use When |
|------|---------|----------|
| `TESTING_GUIDE.md` | Complete testing checklist | Before submission |
| `MARKETING_ASSETS_GUIDE.md` | Screenshot creation guide | Creating assets |
| `STORE_LISTING.md` | Ready-to-paste copy | Filling out submission form |
| `SUBMISSION_GUIDE.md` | Step-by-step submission | Submitting to store |
| `POST_LAUNCH.md` | Post-publication tasks | After approval |

**Supporting files:**

| File | Purpose |
|------|---------|
| `README.md` | Project documentation |
| `LICENSE` | MIT License for open source |
| `CHANGELOG.md` | Version history |
| `CONTRIBUTING.md` | Contribution guidelines |
| `CHROME_WEB_STORE_COMPLIANCE.md` | Policy verification |

---

## Quick Actions

**Right now:**
```bash
# 1. Load extension for testing
cd apps/sorted
open .output/chrome-mv3/  # Open in Finder/Explorer
# Then: chrome://extensions/ → Load unpacked

# 2. Create screenshot directories
mkdir -p assets/store-screenshots assets/store-promo
```

**After testing passes:**
- Create 5 screenshots using MARKETING_ASSETS_GUIDE.md
- Deploy privacy policy to delulu.social
- Follow SUBMISSION_GUIDE.md to submit

---

## Critical Requirements Checklist

Before submission, verify:

- [ ] Extension builds without errors (`pnpm build`)
- [ ] All tests pass (manual testing via TESTING_GUIDE.md)
- [ ] No console errors on Instagram reels pages
- [ ] Works on Chrome 120+
- [ ] 2-5 screenshots created (correct dimensions)
- [ ] Privacy policy live at delulu.social/legal/extension-privacy
- [ ] Store listing copy ready (from STORE_LISTING.md)
- [ ] Chrome developer account created ($5 paid)
- [ ] Extension package uploaded and validated
- [ ] All permission justifications written

---

## Support & Questions

**If you get stuck:**
- Check the specific guide for that phase (TESTING_GUIDE, SUBMISSION_GUIDE, etc.)
- Review Chrome Web Store policies: https://developer.chrome.com/docs/webstore/program-policies
- Email issues to: support@delulu.social (set this up if not already)

**Common issues:**
- **Build errors:** Run `pnpm install` and `pnpm build` again
- **Testing failures:** Check Instagram hasn't changed their UI
- **Upload rejected:** Check manifest.json for errors
- **Review rejected:** Read email carefully and fix cited issues

---

## Success Metrics

### Week 1 Goals:
- 50+ installs
- 4.0+ rating
- 5+ reviews
- No critical bugs

### Month 1 Goals:
- 500+ installs
- 4.5+ rating
- 50+ reviews
- <10% uninstall rate

### Month 3 Goals:
- 2,000+ installs
- v1.1.0 released
- Active community
- Steady growth

---

## What's Next After Launch

**Short term (v1.1.0 - 2-3 months):**
- Add user-requested features
- Performance improvements
- Dark mode refinements
- Keyboard shortcuts

**Long term (v2.0.0 - 6+ months):**
- Firefox support
- Additional platforms (TikTok sorting?)
- Advanced analytics
- Export functionality

---

## Final Notes

**You're ready to launch!** The extension is built, tested, and all documentation is prepared. Just follow the phases above in order.

**Time investment:**
- ~6-8 hours of active work
- ~2-10 days calendar time (including Chrome review)

**Expected outcome:**
- Extension live on Chrome Web Store
- Open source on GitHub
- Users discovering and installing
- Foundation for v1.1.0 and beyond

---

**Good luck with the launch! 🚀**

Last Updated: January 19, 2026
Extension Version: 1.0.0
Status: Ready for submission
