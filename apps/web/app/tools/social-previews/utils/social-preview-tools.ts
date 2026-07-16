import type { SupportedSocialPlatform } from "@delulu/design-system/lib/social-config";

export type SocialPreviewKind = "post" | "profile";

export interface SocialPreviewExample {
  label: string;
  text: string;
  displayName: string;
  username: string;
  headline: string;
}

export interface SocialPreviewToolContent {
  slug: string;
  kind: SocialPreviewKind;
  platform: SupportedSocialPlatform;
  title: string;
  metaTitle: string;
  description: string;
  metaDescription: string;
  keywords: string[];
  intro: string[];
  howToHeading: string;
  howToSteps: Array<{ name: string; text: string }>;
  sections: Array<{ heading: string; paragraphs: string[] }>;
  faq: Array<{ question: string; answer: string }>;
  examples: SocialPreviewExample[];
}

interface PostPreviewDefinition {
  slug: string;
  platform: SupportedSocialPlatform;
  platformName: string;
  title: string;
  description: string;
  identity: string;
  mediaGuidance: string;
  writingGuidance: string;
  example: SocialPreviewExample;
}

function createPostPreviewTool(
  definition: PostPreviewDefinition
): SocialPreviewToolContent {
  const {
    slug,
    platform,
    platformName,
    title,
    description,
    identity,
    mediaGuidance,
    writingGuidance,
    example,
  } = definition;
  return {
    slug,
    kind: "post",
    platform,
    title,
    metaTitle: `${title} – Free Live Post Mockup`,
    description,
    metaDescription: `${description} Edit the text, identity, media, date, and counts live in a private browser preview.`,
    keywords: [
      `${platformName.toLowerCase()} post preview`,
      `${platformName.toLowerCase()} post mockup`,
      `preview ${platformName.toLowerCase()} post`,
      `${platformName.toLowerCase()} content preview`,
    ],
    intro: [
      `Review the complete ${platformName} post before it reaches a live feed. The preview combines your copy, ${identity}, media, date, and representative engagement so spacing and hierarchy are visible while you edit.`,
      `${writingGuidance} Changes stay in this browser tab, and the finished text can move directly into the Delulu composer without uploading the preview media.`,
    ],
    howToHeading: `How to preview a ${platformName} post`,
    howToSteps: [
      {
        name: "Add the post and identity",
        text: `Enter the copy and the ${identity} that readers should see around it.`,
      },
      {
        name: "Choose the media",
        text: mediaGuidance,
      },
      {
        name: "Review and continue",
        text: `Check the native ${platformName} reading pattern, then create the post in Delulu when the draft is ready.`,
      },
    ],
    sections: [
      {
        heading: `What to check in your ${platformName} preview`,
        paragraphs: [
          writingGuidance,
          `${mediaGuidance} Engagement values are editable layout context, not a prediction of performance.`,
        ],
      },
      {
        heading: "Private draft review",
        paragraphs: [
          "Text remains in local page state and selected files use temporary browser URLs. The tool does not connect to a social account or publish anything.",
        ],
      },
    ],
    faq: [
      {
        question: `Is this ${platformName} post preview free?`,
        answer:
          "Yes. It is free to use without signing in, and there is no visible preview limit.",
      },
      {
        question: `Does the preview connect to my ${platformName} account?`,
        answer:
          "No. It works with details you enter locally and never requests access to a social account.",
      },
      {
        question: `Can I add media to the ${platformName} mockup?`,
        answer: mediaGuidance,
      },
      {
        question: `Will ${platformName} line breaks remain visible?`,
        answer:
          "Yes. The preview preserves line breaks so you can inspect paragraph rhythm, truncation risk, and scanning length.",
      },
      {
        question: `Is this an exact copy of the ${platformName} interface?`,
        answer:
          "It follows the platform's recognizable content hierarchy while keeping the card accessible, responsive, and useful for planning.",
      },
      {
        question: "Are the engagement counts real?",
        answer:
          "No. They are editable visual placeholders for checking balance and label wrapping, not analytics or forecasts.",
      },
      {
        question: "Is my uploaded image stored?",
        answer:
          "No. The selected file is shown through a temporary browser URL and is not uploaded by this preview.",
      },
      {
        question: `How do I publish the ${platformName} draft?`,
        answer:
          "Choose Create this post in Delulu. The current text opens in the composer, where you can select a connected account and schedule or publish it.",
      },
    ],
    examples: [example],
  };
}

export const socialPreviewTools: SocialPreviewToolContent[] = [
  {
    slug: "instagram-post-preview",
    kind: "post",
    platform: "INSTAGRAM",
    title: "Instagram Post Preview",
    metaTitle: "Instagram Post Preview – Free Feed Mockup Tool",
    description:
      "Preview an Instagram feed post with your caption, image, profile, date, and engagement counts — live, private, and free.",
    metaDescription:
      "Preview an Instagram feed post with your caption, image, profile, date, and counts. Free, private, live in your browser, and no signup required.",
    keywords: [
      "instagram post preview",
      "instagram feed preview",
      "instagram post mockup",
      "preview instagram caption",
    ],
    intro: [
      "See how a feed post reads before it reaches your audience. Add a caption, identity, image, publishing date, and representative engagement counts; every change appears in the preview immediately.",
      "The preview is intentionally responsive and accessible rather than a pixel-for-pixel copy. Your text and uploaded image stay in this browser tab, and you can carry the finished caption into the Delulu composer when it is ready.",
    ],
    howToHeading: "How to preview an Instagram post",
    howToSteps: [
      {
        name: "Add the post details",
        text: "Enter a display name, username, caption, date, and optional engagement counts.",
      },
      {
        name: "Choose your image",
        text: "Upload a local image and add descriptive alt text. The file stays in your browser.",
      },
      {
        name: "Review and create",
        text: "Check the responsive preview, then send the caption to the Delulu post composer.",
      },
    ],
    sections: [
      {
        heading: "What to check in your feed preview",
        paragraphs: [
          "Look for a strong opening line before the caption truncates, readable line breaks, useful alt text, and a visual that still communicates at phone width.",
          "Engagement counts are illustrative planning inputs, not predictions. Use them to test the balance of the card rather than estimate performance.",
        ],
      },
      {
        heading: "Private, client-side post planning",
        paragraphs: [
          "Caption edits and uploaded media are processed locally. Nothing is uploaded by this preview tool, and resetting removes the local preview state from the page.",
        ],
      },
    ],
    faq: [
      {
        question: "Is this Instagram post preview free?",
        answer:
          "Yes. It is free to use without creating an account, and there is no visible usage limit.",
      },
      {
        question: "Does the preview publish my post?",
        answer:
          "No. It only creates a local visual preview. The composer action opens Delulu with your caption, where you stay in control of publishing.",
      },
      {
        question: "Is my uploaded Instagram image stored?",
        answer:
          "No. The image is displayed from a temporary browser URL and is not sent to this tool's server.",
      },
      {
        question: "Can I test long captions and line breaks?",
        answer:
          "Yes. The caption field preserves line breaks so you can assess the opening, spacing, and overall reading length.",
      },
      {
        question: "What image shape works best in this preview?",
        answer:
          "The card uses a square feed frame. Portrait or landscape uploads are cropped for the preview, so check that the important subject remains visible.",
      },
      {
        question: "Are the likes and comments real?",
        answer:
          "No. They are editable representative counts that help you review the composition of the mock post.",
      },
      {
        question: "Can I add alt text to the preview image?",
        answer:
          "Yes. The media alt-text input is used by the preview image and helps you draft an accessible description before posting.",
      },
      {
        question: "How do I move this caption into Delulu?",
        answer:
          "Choose Create post in Delulu. The tool opens the composer with the current caption prefilled; signing in may be required there.",
      },
    ],
    examples: [
      {
        label: "Product launch",
        displayName: "Maya Chen",
        username: "mayamakes",
        headline: "Independent designer",
        text: "A small launch with a big purpose. ✨\n\nI made this collection for slow mornings, useful desks, and ideas worth keeping. Which color would you pick?",
      },
    ],
  },
  {
    slug: "linkedin-post-preview",
    kind: "post",
    platform: "LINKEDIN",
    title: "LinkedIn Post Preview",
    metaTitle: "LinkedIn Post Preview – Free Professional Post Mockup",
    description:
      "Preview a professional LinkedIn post with your copy, headline, media, date, and engagement details before you publish.",
    metaDescription:
      "Preview a LinkedIn post with your copy, headline, media, date, and engagement details. Free, private, responsive, and no signup required.",
    keywords: [
      "linkedin post preview",
      "linkedin post mockup",
      "preview linkedin post",
      "linkedin text formatter preview",
    ],
    intro: [
      "Professional-feed posts depend on more than the body copy. This live preview combines your name, headline, publishing date, media, and engagement labels so you can review the whole reading experience before publishing.",
      "Use it for launch notes, hiring updates, lessons, and company news. Everything runs locally in your browser, and the current post text can be handed directly to the Delulu composer.",
    ],
    howToHeading: "How to preview a LinkedIn post",
    howToSteps: [
      {
        name: "Set your professional identity",
        text: "Add your name, username, and the headline that should appear beneath your name.",
      },
      {
        name: "Draft the update",
        text: "Write or paste the post, choose a date, and optionally upload supporting media.",
      },
      {
        name: "Check and continue",
        text: "Review the opening lines and visual hierarchy, then open the post in Delulu's composer.",
      },
    ],
    sections: [
      {
        heading: "Write for a professional feed",
        paragraphs: [
          "Make the first two or three lines useful on their own. Short paragraphs and a clear takeaway are easier to scan than one uninterrupted block.",
          "Your headline adds context, while a relevant image can support the point. Avoid adding media that repeats the copy without adding meaning.",
        ],
      },
      {
        heading: "Use realistic context, not predicted results",
        paragraphs: [
          "The reaction and comment fields are mock values for visual review. They do not forecast reach or engagement and are never sent anywhere.",
        ],
      },
    ],
    faq: [
      {
        question: "Is the LinkedIn post preview free to use?",
        answer:
          "Yes. You can preview as many drafts as you need without signing up for the preview tool.",
      },
      {
        question: "Can I preview my LinkedIn headline with the post?",
        answer:
          "Yes. The identity controls include a dedicated professional headline field shown below your display name.",
      },
      {
        question: "Does this tool connect to my LinkedIn account?",
        answer:
          "No. It is an anonymous local mockup and does not request account access or publish anything.",
      },
      {
        question: "Can I preview a LinkedIn image post?",
        answer:
          "Yes. Upload an image from your device to place it below the post text in the responsive preview.",
      },
      {
        question: "Will line breaks remain in my post?",
        answer:
          "Yes. Line breaks are preserved so you can inspect paragraph rhythm and the strength of the opening lines.",
      },
      {
        question: "Are reaction and comment counts predictions?",
        answer:
          "No. They are editable visual placeholders only and should not be treated as performance estimates.",
      },
      {
        question:
          "What should I check before publishing a professional update?",
        answer:
          "Check the first lines, factual accuracy, paragraph length, headline context, media relevance, and the clarity of your final takeaway.",
      },
      {
        question: "Can Delulu schedule the previewed post?",
        answer:
          "The Create post action sends your text to Delulu's composer. From there, signed-in users can choose connected accounts and scheduling options.",
      },
    ],
    examples: [
      {
        label: "Project lesson",
        displayName: "Jordan Lee",
        username: "jordanlee",
        headline: "Product lead · Building calmer workflows",
        text: "We cut our weekly planning meeting from 60 minutes to 25.\n\nThe biggest change was not a new tool. We started writing decisions down before the meeting and used the call only for disagreements.\n\nClear inputs create shorter meetings.",
      },
    ],
  },
  createPostPreviewTool({
    slug: "facebook-post-preview",
    platform: "FACEBOOK",
    platformName: "Facebook",
    title: "Facebook Post Preview",
    description:
      "Preview a Facebook page post with its copy, page identity, image, visibility, reactions, comments, and shares.",
    identity: "page name and profile image",
    mediaGuidance:
      "Choose an image that still communicates when it spans the feed card; the preview keeps it contained without uploading it.",
    writingGuidance:
      "Lead with the useful point, then make the next action clear. Facebook posts often need enough context to make sense when shared beyond the original page.",
    example: {
      label: "Community update",
      displayName: "Harbor Street Market",
      username: "harborstreetmarket",
      headline: "Local market",
      text: "Saturday's market map is ready. Save this post before you arrive, and send it to the friend who always finds the best stall first.\n\nDoors open at 9:00 AM.",
    },
  }),
  createPostPreviewTool({
    slug: "x-post-preview",
    platform: "TWITTER",
    platformName: "X",
    title: "X Post Preview",
    description:
      "Preview an X post with its display name, handle, text, media, replies, reposts, and likes before publishing.",
    identity: "display name and handle",
    mediaGuidance:
      "Add one image to check the rounded media card and confirm that the post still reads clearly with or without the visual.",
    writingGuidance:
      "Keep the first sentence self-contained and remove setup that delays the point. Check long handles, compact action counts, and deliberate line breaks.",
    example: {
      label: "Product note",
      displayName: "Avery Studio",
      username: "averystudio",
      headline: "Design and product",
      text: "The smallest useful launch note:\n\nWhat changed. Why it matters. Where to try it.\n\nEverything else can live in the link.",
    },
  }),
  createPostPreviewTool({
    slug: "threads-post-preview",
    platform: "THREADS",
    platformName: "Threads",
    title: "Threads Post Preview",
    description:
      "Preview a Threads post with conversational copy, profile identity, media, replies, reposts, and likes.",
    identity: "profile name and username",
    mediaGuidance:
      "Use an optional image to see whether it supports the conversation or interrupts a post that works better as text.",
    writingGuidance:
      "Write like a person starting a useful conversation. A direct observation and a specific question usually scan better than a formal announcement.",
    example: {
      label: "Conversation starter",
      displayName: "Nia Brooks",
      username: "niamakes",
      headline: "Creative operations",
      text: "A planning habit that actually stuck: write tomorrow's first task before closing the laptop.\n\nWhat tiny ritual makes your next workday easier?",
    },
  }),
  createPostPreviewTool({
    slug: "tiktok-post-preview",
    platform: "TIKTOK",
    platformName: "TikTok",
    title: "TikTok Post Preview",
    description:
      "Preview a TikTok post with vertical media, caption overlay, username, likes, comments, and shares.",
    identity: "creator username",
    mediaGuidance:
      "Choose a portrait image or video cover and keep important subjects away from the caption and action overlays on the lower and right edges.",
    writingGuidance:
      "Make the caption complement the visual instead of narrating it. Check that the opening phrase remains readable over a busy frame.",
    example: {
      label: "Quick tutorial",
      displayName: "Sam Rivera",
      username: "samcreates",
      headline: "Short-form educator",
      text: "The 20-second desk reset that makes tomorrow morning easier. Save this before your next shutdown routine.",
    },
  }),
  createPostPreviewTool({
    slug: "youtube-post-preview",
    platform: "YOUTUBE",
    platformName: "YouTube",
    title: "YouTube Post Preview",
    description:
      "Preview a YouTube video post with its title, thumbnail, channel identity, views, likes, and primary actions.",
    identity: "channel name and avatar",
    mediaGuidance:
      "Choose a landscape thumbnail and check that its subject, contrast, and text remain clear inside a 16:9 player frame.",
    writingGuidance:
      "Put the video title on the first line. Make it specific enough to set an expectation without repeating every word already shown in the thumbnail.",
    example: {
      label: "Tutorial video",
      displayName: "Field Notes Studio",
      username: "fieldnotesstudio",
      headline: "Practical creative systems",
      text: "Build a weekly content system in 20 minutes\n\nA practical walkthrough for planning, drafting, and reviewing one week at a time.",
    },
  }),
  {
    slug: "instagram-profile-preview",
    kind: "profile",
    platform: "INSTAGRAM",
    title: "Instagram Profile Preview",
    metaTitle: "Instagram Profile Preview – Free Bio & Grid Mockup",
    description:
      "Preview an Instagram profile with your bio, identity, counts, avatar, and up to nine grid images — privately in your browser.",
    metaDescription:
      "Preview an Instagram profile with your bio, identity, counts, avatar, and nine-image grid. Free, private, responsive, and no signup required.",
    keywords: [
      "instagram profile preview",
      "instagram grid preview",
      "instagram bio preview",
      "instagram feed planner preview",
    ],
    intro: [
      "A profile creates an impression before anyone opens an individual post. Preview your avatar, name, username, bio, public counts, and the first nine grid tiles together to spot mismatched imagery or unclear positioning.",
      "Choose several local images at once in the intended grid order. Files remain in your browser, and the profile preview stays a private planning canvas rather than pretending a bio or grid can map directly to a post draft.",
    ],
    howToHeading: "How to preview an Instagram profile and grid",
    howToSteps: [
      {
        name: "Add profile details",
        text: "Enter the username, display name, bio, avatar, and representative public counts.",
      },
      {
        name: "Build the nine-tile grid",
        text: "Select up to nine images in the order you want them to appear in the preview.",
      },
      {
        name: "Review the whole profile",
        text: "Check bio clarity, identity consistency, image variety, and how the grid behaves at narrow widths.",
      },
    ],
    sections: [
      {
        heading: "Plan a coherent profile without making every tile identical",
        paragraphs: [
          "A strong grid can repeat color, subject, or composition without becoming monotonous. Review adjacent tiles for accidental clashes and make sure recent posts explain what the account is about.",
          "The profile preview is a planning canvas, not a promise of exact platform rendering. It favors readable, responsive layout and clear image alternatives.",
        ],
      },
      {
        heading: "Keep profile planning private",
        paragraphs: [
          "Your avatar and grid selections are represented with temporary local browser URLs. They are not uploaded by this tool and disappear when the page is reset or closed.",
        ],
      },
    ],
    faq: [
      {
        question: "Is this Instagram profile preview free?",
        answer:
          "Yes. It is a free browser tool with no signup and no visible limit on previews.",
      },
      {
        question: "How many grid images can I preview?",
        answer:
          "You can select up to nine images, enough to review the first three rows as one composition.",
      },
      {
        question: "Are my profile and grid images uploaded?",
        answer:
          "No. Selected files are shown through temporary URLs created inside your browser and are not stored by the tool.",
      },
      {
        question: "Can I preview an Instagram bio with line breaks?",
        answer:
          "Yes. The bio preserves line breaks so you can judge clarity and spacing in the profile card.",
      },
      {
        question: "Does the tool show an exact platform profile?",
        answer:
          "No. It is an accessible, responsive planning preview inspired by the information hierarchy, not a pixel-perfect copy.",
      },
      {
        question: "What order will my selected grid images use?",
        answer:
          "Images appear in the order returned by your file picker, from the first tile at top left through the ninth tile at bottom right.",
      },
      {
        question: "Can I use representative follower counts?",
        answer:
          "Yes. Posts, followers, and following are editable display values for checking the profile layout; they are not verified account data.",
      },
      {
        question: "Why is there no create-post button on the profile preview?",
        answer:
          "A profile bio and nine-tile grid do not map cleanly to one post. Composer handoff is intentionally reserved for the post previews where the result transfers without changing meaning.",
      },
    ],
    examples: [
      {
        label: "Creator profile",
        displayName: "Maya Chen",
        username: "mayamakes",
        headline: "Independent designer",
        text: "Objects, notes, and tiny systems for a calmer creative practice.\nNew work every Thursday.",
      },
    ],
  },
];

export const getSocialPreviewTool = (
  slug: string
): SocialPreviewToolContent | undefined =>
  socialPreviewTools.find((tool) => tool.slug === slug);

export function buildComposerUrl(
  text: string,
  options: { appOrigin?: string } = {}
): string {
  const appOrigin =
    options.appOrigin ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://solulu.delulu.social";
  const url = new URL("/post", appOrigin);
  const handoff = new URLSearchParams({
    text: text.slice(0, 3000),
    source: "social-preview-tool",
  });
  // Fragments are available to the client composer but are never included in
  // the HTTP request or server logs.
  url.hash = handoff.toString();
  return url.toString();
}
