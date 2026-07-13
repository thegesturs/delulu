# Chrome Web Store Listing — Sorted v2.0.0

Complete copy for Chrome Web Store submission. All text optimized for character limits and review requirements.

---

## Basic Information

### Extension Name (45 char limit)

```
Sorted - Instagram Reel Sorter
```

(34 characters)

### Summary / Short Description (132 char limit)

```
Sort Instagram reels by likes, views, or comments. Transcribe reel audio to text with AI. Free tier included.
```

(111 characters)

---

### Detailed Description (16,000 char limit)

```
Sort and analyze Instagram reels by engagement metrics. Transcribe reel audio to text with AI — including Hindi to Hinglish transliteration.

KEY FEATURES

Sort Reels by Engagement
- Sort by Most Liked, Most Viewed, Most Commented, or Oldest
- Process 25, 50, or all reels on any profile
- Rank badges show top-performing content (#1, #2, #3...)
- One-click reset to restore Instagram's original order

AI Transcription
- Transcribe any reel's audio to text with one click
- Hindi reels automatically get Hinglish (Roman script) version
- Toggle between Devanagari and Roman script
- Copy transcription text with one click
- Full transcription history saved to your account

Beautiful Interface
- Modern, clean design that blends with Instagram
- Responsive grid layout (adapts to screen size)
- Smooth animations and loading states
- Seamless integration with Instagram's native interface

HOW TO USE

1. Sign in with your Delulu account (free)
2. Navigate to any Instagram profile's Reels tab
3. The sort panel appears above the reels grid automatically
4. Select your sorting metric and quantity
5. Click "Sort Reels" to reorder by engagement
6. Hover over any reel to download or transcribe audio
7. View transcription history in the extension popup

PRICING

- Free: 10 transcriptions per month
- Pro:  $2/mo [0.02 per transcription] (cheapest in the market)
- Sorting is always free and unlimited
- Up to 1,000 transcriptions/month
- Overage is charged based on usage — you only pay for what you use

PRIVACY & PERMISSIONS

Sorted requires these permissions:

Storage — Saves sorting preferences, authentication state, and active transcription status locally on your device.

Cookies — Required for secure authentication with your Delulu account via Clerk.

Active Tab — Detects when you're on an Instagram reels tab to show the sort panel.

Instagram Access (host_permissions) — Reads reel engagement metrics from Instagram pages and injects the sorting UI.

Clerk & Delulu Access (host_permissions) — Authenticates your account securely for transcription and subscription features.

What happens with your data:
- Reel audio is sent to our secure transcription API for processing
- Transcription text is stored in your account for history access
- Account information (email, user ID) is used for authentication only
- Sorting data (likes, views, comments) is processed locally in your browser
- We do NOT access your Instagram credentials
- We do NOT read DMs, stories, or feed posts
- We do NOT sell or share your data with third parties

Read our full privacy policy: https://delulu.social/legal/extension-privacy

SUPPORT

- Website: https://delulu.social
- Email: support@delulu.social

IMPORTANT NOTES

- Works on Instagram profile reels tabs (not home feed or explore)
- Transcription requires a free Delulu account
- Not affiliated with Instagram or Meta Platforms, Inc.

Made by Delulu Social | https://delulu.social
```

---

## Store Listing Fields

### Category
Social & Communication

### Language
English (US)

### Mature Content Rating
Everyone

### Website URL
https://delulu.social

### Support URL
https://delulu.social

### Support Email
support@delulu.social

### Privacy Policy URL
https://delulu.social/legal/extension-privacy

---

## Privacy Practices (Chrome Web Store Disclosure)

### Single Purpose Description (200 char limit)

```
Sort Instagram reels by engagement metrics and transcribe reel audio to text using AI.
```

(87 characters)

### Does this extension collect user data?
**Yes**

### Data Usage Disclosures

#### 1. Authentication Information
- **Field:** Personally identifiable information
- **Usage:** Used for authenticating users via Clerk to enable transcription features and subscription management
- **Collected?** Yes — email address and user ID from Clerk authentication
- **Transmitted off device?** Yes — to the authentication provider and Delulu application API
- **Sold to third parties?** No
- **Used for purposes unrelated to extension?** No

#### 2. User Activity
- **Field:** User activity (transcription history)
- **Usage:** Stores transcription results so users can access their history
- **Collected?** Yes — transcription text, reel URLs, timestamps
- **Transmitted off device?** Yes — to the Delulu application and transcription APIs
- **Sold to third parties?** No
- **Used for purposes unrelated to extension?** No

#### 3. Website Content
- **Field:** Website content
- **Usage:** Reel audio is sent to our API for transcription. Reel engagement metrics (likes, views, comments) are read for sorting.
- **Collected?** Partially — audio is processed and discarded; transcription text is stored. Engagement metrics are processed locally only.
- **Transmitted off device?** Yes — reel audio to transcription API
- **Sold to third parties?** No
- **Used for purposes unrelated to extension?** No

### Certification Statement

```
This extension collects authentication data (email, user ID via Clerk) and user-generated transcription data (transcribed text, reel URLs). Reel audio is transmitted to our secure API for AI transcription and is not retained after processing. Transcription results are stored in the user's account. Reel engagement metrics (likes, views, comments) used for sorting are processed entirely in the browser and never transmitted. We do not sell any data to third parties.
```

### Does this extension use remote code?
**No** — All code is bundled within the extension package.

---

## Permission Justifications

### 1. `storage` Permission

```
Stores user authentication state, sorting preferences (sort type, quantity), and active transcription status locally. Also caches the authenticated session token for API requests. No sensitive credentials are stored — only session references managed by Clerk.
```

### 2. `cookies` Permission

```
Required for Clerk authentication. The extension reads authentication cookies set by clerk.delulu.social to maintain the user's signed-in session across extension popup opens. Without this permission, users would need to re-authenticate every time they open the popup.
```

### 3. `activeTab` Permission

```
Detects when the user is viewing an Instagram profile's reels tab to inject the sorting UI and show active status in the popup. Also used to identify the current page URL for reel detection.
```

### 4. Host Permissions — `instagram.com`

```
Required to inject the sorting UI into Instagram's reels grid, intercept GraphQL API responses containing reel engagement metrics (likes, views, comments), and add hover overlays for download/transcribe actions. Content scripts run only on Instagram pages.
```

### 5. Host Permissions — `clerk.delulu.social`, `solulu.delulu.social`

```
Required for user authentication. clerk.delulu.social handles the Clerk authentication flow. solulu.delulu.social is the FAPI sync host that maintains session state between the extension and the Delulu platform. Users sign in via these domains to access transcription features.
```

### 6. Host Permissions — `rapid-doe-87.clerk.accounts.dev`

```
Clerk's development authentication endpoint used during testing. Required for the authentication SDK to function correctly across environments.
```

### 7. Host Permissions — `localhost`

```
Used during development only. Can be removed in production if desired, but has no effect on end users as no localhost services are accessed in production.
```

---

## Test Instructions (for Chrome Web Store Reviewers)

```
Test: [EMAIL] [PASSWORD]

Sort:
1. Go to instagram.com/natgeo/reels/
2. Sort panel appears above grid — select Most Liked, click Sort Reels
3. Reels reorder with rank badges

Transcribe:
1. Sign in with Delulu
2. Hover any reel, click mic icon
3. Modal shows "Transcribing..." — after 10–30s text appears
4. Copy; check Sorted popup for Recent Transcriptions

Notes:
- Test account has [X] free transcriptions remaining
- Extension only activates on Instagram profile reels tabs
```

---

## What to Update in Privacy Policy

The extension privacy policy at `https://delulu.social/legal/extension-privacy` needs these updates for v2:

### Remove / Change
- Remove all "ZERO data collection" claims
- Remove "No external servers or API calls"
- Remove "does not communicate with external servers"
- Remove "No third-party services"
- Change "Does NOT use cookies" to explain cookie usage

### Add — Authentication
```
Sorted uses Clerk (https://clerk.com) for authentication. When you sign in:
- Your email address and user ID are stored by Clerk
- A session cookie is set on clerk.delulu.social to maintain your login
- Your Clerk user ID is associated with your transcription history
- Clerk's privacy policy: https://clerk.com/legal/privacy
```

### Add — Transcription Data
```
When you transcribe a reel:
- The reel's audio is extracted and sent to our secure transcription API hosted on AWS
- Audio is processed by Groq's Whisper AI model for speech-to-text conversion
- The audio is NOT stored — it is discarded after transcription
- The resulting text, reel URL, and timestamp are stored in your Delulu account
- For Hindi audio, an additional Hinglish (Roman script) version is generated and stored
- You can view your transcription history in the extension popup
```

### Add — Delulu application data
```
Sorted uses the Delulu application API to store account data:
- Stores transcription text, reel URLs, timestamps, and usage counts
- Data is associated with your authenticated user ID
- Data is stored in the United States
- Delulu's privacy policy applies to stored account data
```

### Add — Payments
```
Sorted uses Dodo Payments for subscription billing:
- Payment is processed entirely on Dodo Payments' hosted checkout page
- We do not see or store your payment card details
- We receive subscription status (active/canceled) and plan information
- Dodo Payments' privacy policy: https://dodopayments.com/legal/privacy
```

### Add — Cookies Section (replace old one)
```
The Extension uses cookies for authentication:
- Authentication cookies are set by Clerk on clerk.delulu.social
- These cookies maintain your signed-in session
- Session cookies expire when you sign out or after the session timeout
- No tracking cookies, advertising cookies, or third-party cookies are used
- The "cookies" Chrome permission is required solely for reading Clerk auth cookies
```

### Add — Storage Section (update old one)
```
Chrome's storage.local API is used to store:
- Sorting preferences (sort type, quantity)
- Active transcription state (which reel is currently being transcribed)
- Authentication session references

Storage size: Less than 10 KB
All storage is local to your Chrome browser profile.
```

---

## Pricing (Store Field)
**Distribution:** Free
**In-App Purchases:** Yes (Pro subscription via external checkout)

---

## Distribution
**Regions:** All regions
**Visibility:** Public
