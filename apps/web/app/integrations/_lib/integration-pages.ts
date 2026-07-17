import type { SupportedSocialPlatform } from "@delulu/design-system/lib/social-config";
import { type FeatureSlug, features } from "@/app/features/features";

export type IntegrationWorkflow =
  | "Short-form video"
  | "Visual publishing"
  | "Professional updates"
  | "Conversation and community";

export interface IntegrationPageDefinition {
  readonly slug: string;
  readonly platform: SupportedSocialPlatform;
  readonly name: string;
  readonly availability: "self-serve" | "feature-gated" | "limited-access";
  readonly workflows: readonly IntegrationWorkflow[];
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly metaTitle: string;
  readonly metaDescription: string;
  readonly summary: readonly string[];
  readonly highlights: readonly { label: string; value: string }[];
  readonly formats: readonly { title: string; body: string }[];
  readonly setup: readonly { title: string; body: string }[];
  readonly reasons: readonly { title: string; body: string }[];
  readonly examples: readonly { title: string; body: string }[];
  readonly limitations: readonly string[];
  readonly questions: readonly { question: string; answer: string }[];
  readonly related: readonly string[];
}

export const integrationPages = [
  {
    slug: "instagram",
    platform: "INSTAGRAM",
    name: "Instagram",
    availability: "self-serve",
    workflows: ["Short-form video", "Visual publishing"],
    eyebrow: "Instagram publishing and automation",
    title: "Plan, schedule, and publish Instagram content with Delulu",
    description:
      "Connect an Instagram business profile, prepare feed posts and Reels, and keep comment-to-DM follow-up in the same creator workflow.",
    metaTitle: "Instagram Scheduler, Reels Publisher & Auto-DM",
    metaDescription:
      "Connect Instagram to Delulu to schedule feed images, carousels, and Reels, and build comment-triggered DM workflows for a business profile.",
    summary: [
      "Delulu brings Instagram publishing and audience follow-up into one workspace. You can prepare a caption, add an image carousel or a single video, choose the connected profile, and publish now or place the post on your calendar.",
      "Instagram is also the platform where Delulu's automation workflow goes deeper. A connected business profile can power comment-triggered direct-message flows, follower checks, email capture steps, and multi-step conversations without moving the campaign into another tool.",
    ],
    highlights: [
      { label: "Media", value: "Images, carousels, and one Reel" },
      { label: "Caption limit", value: "2,200 characters" },
      { label: "Automation", value: "Comment-triggered DM flows" },
      { label: "Connection", value: "Available in Connected Accounts" },
    ],
    formats: [
      {
        title: "Feed images and carousels",
        body: "Publish one image or a carousel of up to 10 images. Delulu validates the media count before publishing so a campaign does not fail on an avoidable format mismatch.",
      },
      {
        title: "Reels with cover controls",
        body: "Publish a single video as a Reel and use an uploaded cover or a selected video timestamp when available. Eligible accounts can also configure trial-Reel behavior.",
      },
      {
        title: "Comment and DM follow-up",
        body: "For response campaigns, Delulu can watch supported comment events and send the next approved step in a direct-message flow tied to the connected business profile.",
      },
    ],
    setup: [
      {
        title: "Open Connected Accounts",
        body: "Create or enter a Delulu workspace, open Connected Accounts, and choose Instagram from the connection dialog.",
      },
      {
        title: "Authorize a business profile",
        body: "Sign in through Instagram and approve the business profile, publishing, comment, and messaging permissions needed for the workflows you plan to use. Delulu never asks for your Instagram password directly.",
      },
      {
        title: "Create the post or automation",
        body: "Choose the connected profile in the composer for publishing, or create an Instagram automation and select the post, trigger, and message steps for a response flow.",
      },
    ],
    reasons: [
      {
        title: "Run publishing and replies together",
        body: "The content that earns a comment and the follow-up that serves that commenter can be planned in the same workspace, which reduces handoffs and missed campaign steps.",
      },
      {
        title: "Adapt one campaign for several channels",
        body: "Start with shared campaign content, then give Instagram its own caption, media choice, and settings while the rest of the post stays coordinated.",
      },
      {
        title: "Protect the calendar from invalid drafts",
        body: "Delulu checks the Instagram caption and media shape before publishing, including the single-video or image-carousel rule.",
      },
    ],
    examples: [
      {
        title: "Lead magnet Reel",
        body: "Schedule a Reel that asks viewers to comment with a keyword, then send the promised resource through a short DM flow and capture an email only when it is useful.",
      },
      {
        title: "Product launch carousel",
        body: "Arrange up to 10 product images, write a launch caption, and schedule the carousel alongside adapted updates for Facebook and LinkedIn.",
      },
      {
        title: "Trial-Reel experiment",
        body: "For an eligible account, publish a trial Reel to non-followers first and choose manual or performance-based graduation before the campaign goes live.",
      },
    ],
    limitations: [
      "Instagram publishing requires at least one image or video. Delulu does not mix a video and images in the same Instagram post.",
      "A post can contain one video or up to 10 images; multiple videos are not supported in one draft.",
      "The current publisher creates feed image posts, carousels, and Reels. It does not create a standalone Instagram Story, even though the editor model contains Story-related fields.",
      "Business permissions and account eligibility are controlled by Instagram. Trial Reels and some messaging behavior may not be available to every profile.",
      "Automation is event-driven, so an unsupported event or revoked permission can prevent the next DM step from running until the connection is repaired.",
    ],
    questions: [
      {
        question: "Can Delulu schedule Instagram Reels?",
        answer:
          "Yes. Add one video, select the Instagram profile, configure the Reel settings, and publish immediately or choose a scheduled time.",
      },
      {
        question: "Can I schedule an Instagram carousel?",
        answer:
          "Yes. Delulu supports image carousels with up to 10 images. It does not currently combine images and video in the same carousel.",
      },
      {
        question: "Does Delulu send automatic Instagram DMs?",
        answer:
          "Delulu supports comment-triggered, multi-step Instagram DM workflows for connected business profiles with the required permissions. You define the trigger and every message step.",
      },
      {
        question: "Does Delulu need my Instagram password?",
        answer:
          "No. The connection uses Instagram's authorization flow. Your password is entered with Instagram, not into Delulu.",
      },
    ],
    related: ["facebook", "tiktok", "threads"],
  },
  {
    slug: "facebook",
    platform: "FACEBOOK",
    name: "Facebook",
    availability: "self-serve",
    workflows: ["Visual publishing", "Professional updates"],
    eyebrow: "Facebook Page publishing",
    title: "Schedule Facebook Page posts without rebuilding the campaign",
    description:
      "Connect a managed Facebook Page, choose it during setup, and publish text, image albums, or a single video from Delulu's shared calendar.",
    metaTitle: "Facebook Page Scheduler & Post Publisher",
    metaDescription:
      "Use Delulu to connect a Facebook Page, schedule text, image, album, and video posts, and coordinate Page content with the rest of your campaign.",
    summary: [
      "Delulu connects to Facebook Pages you manage, not to a personal-profile publishing shortcut. After authorization, you choose the Page you want to add, then use that connection in the composer and calendar.",
      "A Facebook draft can stay aligned with a wider campaign while keeping its own message and media. That makes it useful for teams publishing the same announcement in different forms across professional, visual, and short-form channels.",
    ],
    highlights: [
      { label: "Destination", value: "Managed Facebook Pages" },
      { label: "Media", value: "Up to 10 images or one video" },
      { label: "Publishing", value: "Page feed or Page Reel" },
      { label: "Connection", value: "Two-step Page selection" },
    ],
    formats: [
      {
        title: "Text updates",
        body: "Publish a Page update without media when the message stands on its own. Facebook's generous message limit works well for detailed announcements and event context.",
      },
      {
        title: "Single images and albums",
        body: "Add one image or an album of up to 10 images. Use this for product collections, event recaps, before-and-after sets, or a visual campaign sequence.",
      },
      {
        title: "Video posts",
        body: "Publish one video as a Page video workflow. Delulu waits for provider-side processing before recording the final post result.",
      },
    ],
    setup: [
      {
        title: "Choose Facebook in Connected Accounts",
        body: "Open your workspace's Connected Accounts page and start the Facebook connection. The authorization request asks for the Page-management permissions required to publish.",
      },
      {
        title: "Select the Page",
        body: "After authorization, Delulu lists the Pages you manage. Choose the exact Page to add; each selected Page becomes its own publishing connection.",
      },
      {
        title: "Add it to a draft",
        body: "Select the connected Page in the composer, keep shared campaign content or write a Facebook-specific version, then schedule or publish.",
      },
    ],
    reasons: [
      {
        title: "Know exactly where the post will land",
        body: "The Page picker prevents a vague account connection from hiding the destination. Teams can connect and label the specific Pages they publish to.",
      },
      {
        title: "Reuse the campaign, not generic copy",
        body: "Keep the launch date and assets coordinated, then write a Page update with the context Facebook followers need.",
      },
      {
        title: "Handle media rules before publish time",
        body: "Delulu rejects mixed image-and-video drafts and excessive media counts before they reach the provider.",
      },
    ],
    examples: [
      {
        title: "Local event announcement",
        body: "Publish a detailed Page update with the date, location, and one key image while shorter versions go to conversational networks.",
      },
      {
        title: "Customer story album",
        body: "Schedule a sequence of images from a case study or event and use the message to give the album enough context to stand alone.",
      },
      {
        title: "Cross-channel launch video",
        body: "Upload one campaign video, tailor the Facebook message, and coordinate its scheduled time with Instagram, TikTok, and YouTube versions.",
      },
    ],
    limitations: [
      "Delulu publishes to managed Facebook Pages. It does not advertise personal-profile publishing.",
      "A single post can use up to 10 images or one video. Images and video cannot be mixed in the same draft.",
      "The Page must appear in the account authorized during setup, and the approving user must retain the required Page tasks.",
      "The current Page publisher does not forward the draft's audience field. Do not rely on Delulu to change Facebook Page visibility per post.",
      "Connection and publishing availability still depend on Facebook permissions and provider processing status.",
    ],
    questions: [
      {
        question: "Can I connect more than one Facebook Page?",
        answer:
          "You can add managed Pages as separate connections, subject to your Delulu plan's social-account limit. Choose the intended Page when composing a post.",
      },
      {
        question: "Can Delulu publish Facebook albums?",
        answer:
          "Yes. A Facebook post can include up to 10 images. Delulu treats that as an image-based Page post and does not mix a video into the same draft.",
      },
      {
        question: "Can I publish a Facebook Reel?",
        answer:
          "Delulu supports one video in a Facebook draft. Final presentation and processing are controlled by Facebook, so review the published Page result for campaign-critical posts.",
      },
      {
        question: "Why do I have to choose a Page after connecting?",
        answer:
          "Facebook authorization can return several Pages you manage. Delulu's second step records the exact Page and its Page token rather than guessing the destination.",
      },
    ],
    related: ["instagram", "linkedin", "youtube"],
  },
  {
    slug: "linkedin",
    platform: "LINKEDIN",
    name: "LinkedIn",
    availability: "self-serve",
    workflows: ["Professional updates"],
    eyebrow: "LinkedIn content scheduling",
    title: "Turn campaign material into clear LinkedIn posts",
    description:
      "Connect a LinkedIn identity and schedule text, images, video, or a document with platform-specific copy.",
    metaTitle: "LinkedIn Post Scheduler for Text, Video & Documents",
    metaDescription:
      "Schedule LinkedIn posts with Delulu. Publish text, up to four images, one video, or one document with copy tailored to a professional audience.",
    summary: [
      "LinkedIn posts usually need more context than a short caption. Delulu lets you keep the campaign date and assets shared while giving LinkedIn its own longer-form copy, title, and media choice.",
      "The current connection flow authorizes a member identity. Publishing supports text-only posts, multi-image posts, a single video, or a single document, making the integration useful for founder updates, product education, and document-led explainers.",
    ],
    highlights: [
      { label: "Post text", value: "Up to 3,000 characters" },
      { label: "Images", value: "Up to 4 per post" },
      { label: "Rich media", value: "One video or one document" },
      { label: "Distribution", value: "Public member post" },
    ],
    formats: [
      {
        title: "Text and image posts",
        body: "Publish a text-only update or add up to four images. This works well for product notes, event highlights, and short visual breakdowns.",
      },
      {
        title: "Native video",
        body: "Upload one video with the post. Delulu handles the provider's upload and processing flow before the post is marked as published.",
      },
      {
        title: "Document posts",
        body: "Attach one PDF, presentation, or supported word-processing document. A document draft cannot also contain images or video.",
      },
    ],
    setup: [
      {
        title: "Connect LinkedIn",
        body: "Open Connected Accounts, choose LinkedIn, and approve the profile and publishing permissions in LinkedIn's authorization screen.",
      },
      {
        title: "Confirm the identity",
        body: "Return to Delulu and confirm the connected member name. The provider does not supply a public handle in this flow, so Delulu displays the person's name.",
      },
      {
        title: "Build the platform version",
        body: "Select LinkedIn in the composer, write the post, choose one supported media shape, and add the item to the calendar or publish it.",
      },
    ],
    reasons: [
      {
        title: "Give professional readers the missing context",
        body: "Write a complete LinkedIn narrative without forcing the same long copy onto every other channel in the campaign.",
      },
      {
        title: "Reuse durable assets",
        body: "A deck, PDF, product clip, or set of screenshots can become a native LinkedIn post while remaining coordinated with the wider launch.",
      },
      {
        title: "Review before the deadline",
        body: "Teams can prepare the platform-specific version on the shared calendar instead of assembling it immediately before publication.",
      },
    ],
    examples: [
      {
        title: "Founder launch note",
        body: "Turn a release announcement into a first-person post with the problem, decision, and result, then schedule it beside the product's visual launch posts.",
      },
      {
        title: "Document explainer",
        body: "Upload one PDF or slide deck and use the post copy to explain who it is for and what readers will learn before opening it.",
      },
      {
        title: "Conference recap",
        body: "Choose up to four strong event images, tag the lessons in the copy, and schedule a follow-up while the details are still fresh.",
      },
    ],
    limitations: [
      "Media types are mutually exclusive: use images, one video, or one document, not a mixture.",
      "Document posts support one file up to 100 MB. Video uploads are limited to one file and are validated against the provider workflow.",
      "The current authorization stores a member identity. Do not assume that every organization Page is available as a selectable destination.",
      "The current publisher sends posts with public visibility. The visibility field in the draft model is not forwarded to LinkedIn yet.",
      "The current LinkedIn token flow does not provide an automatic refresh token, so a manual reconnect may be required when the token expires.",
    ],
    questions: [
      {
        question: "Can Delulu schedule LinkedIn document posts?",
        answer:
          "Yes. Attach one supported PDF, presentation, or word-processing document and schedule it like another post. Do not add images or video to the same draft.",
      },
      {
        question: "Can I post several images on LinkedIn?",
        answer: "Yes. Delulu supports up to four images in one LinkedIn post.",
      },
      {
        question: "Does Delulu post to LinkedIn company Pages?",
        answer:
          "The current connection records the authorized member identity. Although the permission set includes organization publishing, the public workflow should not be treated as a guaranteed company-Page picker.",
      },
      {
        question: "What happens when the LinkedIn connection expires?",
        answer:
          "Delulu surfaces expiring and expired connection health in Connected Accounts. Reauthorize the identity before the deadline to avoid failed scheduled posts.",
      },
    ],
    related: ["facebook", "twitter", "youtube"],
  },
  {
    slug: "tiktok",
    platform: "TIKTOK",
    name: "TikTok",
    availability: "self-serve",
    workflows: ["Short-form video"],
    eyebrow: "TikTok video scheduling",
    title: "Prepare TikTok posts with the required publishing choices",
    description:
      "Connect TikTok, upload one video, set privacy and interaction controls, disclose promotional content, and schedule it with your campaign.",
    metaTitle: "TikTok Video Scheduler with Privacy Controls",
    metaDescription:
      "Schedule TikTok videos with Delulu. Set visibility, comments, Duet, Stitch, and promotional-content disclosure before publishing one video.",
    summary: [
      "TikTok publishing has required choices that cannot be safely guessed. Delulu puts privacy, comments, Duet, Stitch, and promotional-content disclosure into the post workflow so the video is configured before it enters the schedule.",
      "Use the TikTok version of a shared campaign to keep the launch coordinated while choosing a platform-specific caption, video, cover timestamp, and audience settings.",
    ],
    highlights: [
      { label: "Required media", value: "Exactly one video" },
      { label: "Settings", value: "Privacy and interaction controls" },
      { label: "Disclosure", value: "Brand and paid-partnership options" },
      { label: "Connection", value: "Available in Connected Accounts" },
    ],
    formats: [
      {
        title: "Single-video posts",
        body: "Every TikTok draft requires exactly one video. Images, image carousels, and multiple-video drafts are rejected before publishing.",
      },
      {
        title: "Caption and cover timing",
        body: "Write the TikTok-specific text and, when the uploaded video exposes a thumbnail timestamp, choose the moment used for the cover request.",
      },
      {
        title: "Audience and interaction settings",
        body: "Choose an eligible privacy level and decide whether viewers can comment, Duet, or Stitch. Available privacy choices can vary by the connected creator account.",
      },
    ],
    setup: [
      {
        title: "Connect the TikTok profile",
        body: "Choose TikTok in Connected Accounts and authorize profile access plus video upload and publishing permissions.",
      },
      {
        title: "Add one video",
        body: "Open the composer, select the connected TikTok profile, upload a supported video, and write the platform version of the caption.",
      },
      {
        title: "Complete required settings",
        body: "Select privacy, interaction permissions, and the correct promotional-content disclosure. Delulu will not rely on silent defaults for this required step.",
      },
    ],
    reasons: [
      {
        title: "Avoid missing consent fields",
        body: "Required creator settings are part of the draft, so a scheduled video is less likely to stop at publish time for an unanswered provider question.",
      },
      {
        title: "Coordinate short-form launches",
        body: "Place TikTok, Instagram Reel, and YouTube video versions on one calendar while preserving separate captions and controls.",
      },
      {
        title: "Make disclosure intentional",
        body: "Mark content for your own brand, a paid partnership, both, or neither rather than leaving the commercial context ambiguous.",
      },
    ],
    examples: [
      {
        title: "Three-platform product demo",
        body: "Use one edited vertical video as the source, then prepare distinct TikTok, Instagram, and YouTube versions with the settings each destination requires.",
      },
      {
        title: "Paid creator post",
        body: "Choose the paid-partnership disclosure and an eligible public audience, then confirm comments, Duet, and Stitch settings before scheduling.",
      },
      {
        title: "Private review draft",
        body: "Publish to the private audience available to the account for a final provider-side check before preparing the public campaign version.",
      },
    ],
    limitations: [
      "Delulu's TikTok publisher requires exactly one video. It does not publish image posts or multi-video drafts.",
      "TikTok controls which privacy levels and interaction options are eligible for the connected account.",
      "Paid or mixed promotional content cannot use the private-only visibility setting in Delulu's validation.",
      "Provider-side video processing can take time. A scheduled post is not complete until TikTok accepts and processes the upload.",
      "The current provider request uses the first 150 characters of the draft text as the TikTok video title. Put the essential message first.",
    ],
    questions: [
      {
        question: "Can Delulu schedule TikTok videos?",
        answer:
          "Yes. Connect TikTok, upload one video, complete the required settings, and choose a scheduled time or publish immediately.",
      },
      {
        question: "Can I schedule a TikTok photo carousel?",
        answer:
          "No. Delulu's current TikTok integration requires one video and does not support image posts.",
      },
      {
        question: "Can I control comments, Duet, and Stitch?",
        answer:
          "Yes. Those controls are stored with the TikTok version of the post, subject to what the connected account allows.",
      },
      {
        question: "Does Delulu support branded-content disclosure?",
        answer:
          "Yes. Choose no promotion, your own brand, a paid partnership, or both. Delulu also prevents an incompatible private-only setting for paid disclosures.",
      },
    ],
    related: ["instagram", "youtube", "facebook"],
  },
  {
    slug: "youtube",
    platform: "YOUTUBE",
    name: "YouTube",
    availability: "self-serve",
    workflows: ["Short-form video"],
    eyebrow: "YouTube video publishing",
    title:
      "Schedule YouTube video posts with titles, privacy, and audience settings",
    description:
      "Connect a YouTube channel, upload one video, write its title and description, set privacy and audience details, and publish from Delulu.",
    metaTitle: "YouTube Video & Shorts Scheduler",
    metaDescription:
      "Use Delulu to schedule a YouTube video with a title, description, privacy, made-for-kids status, and an optional custom thumbnail.",
    summary: [
      "Delulu's YouTube workflow is built around one video, a dedicated title, a long-form description, and the audience choices YouTube requires. It is especially useful when the same vertical campaign also has TikTok and Instagram versions.",
      "You can choose public, unlisted, or private visibility, mark whether the video is made for kids, and upload a custom image thumbnail when the channel is eligible.",
    ],
    highlights: [
      { label: "Required media", value: "One video" },
      { label: "Description", value: "Up to 5,000 characters" },
      { label: "Visibility", value: "Public, unlisted, or private" },
      { label: "Thumbnail", value: "Custom image for eligible channels" },
    ],
    formats: [
      {
        title: "Video and Shorts workflows",
        body: "Upload one video and give it a YouTube-specific title and description. YouTube determines the final classification and presentation, including whether a vertical upload qualifies as a Short.",
      },
      {
        title: "Custom thumbnails",
        body: "Attach a custom image thumbnail to the video. YouTube requires channel verification before its API will accept a custom thumbnail.",
      },
      {
        title: "Audience and privacy controls",
        body: "Choose public, unlisted, or private visibility and record the made-for-kids status with the draft.",
      },
    ],
    setup: [
      {
        title: "Authorize the channel",
        body: "Choose YouTube in Connected Accounts and authorize channel read and video-upload access through the provider's sign-in screen.",
      },
      {
        title: "Prepare the video details",
        body: "Select the channel in the composer, add one supported video, write a clear title and description, and optionally add a custom image thumbnail.",
      },
      {
        title: "Set audience and publish time",
        body: "Choose visibility and made-for-kids status, then publish immediately or place the video on the shared calendar.",
      },
    ],
    reasons: [
      {
        title: "Keep video metadata with the campaign",
        body: "The title, description, thumbnail, and audience choices stay attached to the YouTube version instead of living in a separate launch note.",
      },
      {
        title: "Coordinate vertical video releases",
        body: "Schedule the YouTube upload alongside adapted TikTok and Instagram versions without flattening their different metadata needs.",
      },
      {
        title: "Make private review practical",
        body: "Use private or unlisted visibility when you need a provider-hosted review step before making the final video public.",
      },
    ],
    examples: [
      {
        title: "Short-form launch sequence",
        body: "Schedule a vertical product clip on YouTube, TikTok, and Instagram, with a search-friendly YouTube title and a fuller description.",
      },
      {
        title: "Unlisted stakeholder review",
        body: "Publish an unlisted upload with the final title and thumbnail, share it for approval, then prepare a public version when the review is complete.",
      },
      {
        title: "Audience-classified educational clip",
        body: "Record whether the video is made for kids in the scheduled draft rather than treating that required audience decision as an afterthought.",
      },
    ],
    limitations: [
      "Each Delulu YouTube draft requires one video. Image-only posts and multiple videos are not supported.",
      "YouTube, not Delulu, decides whether an uploaded video appears as a Short based on the platform's current rules.",
      "Custom thumbnails require a verified YouTube channel and can still be rejected by the provider.",
      "The draft model contains an age-restriction field, but the current publisher does not forward it. Apply any required age restriction on YouTube after publishing.",
      "The current upload guard accepts supported video formats up to 2 GB; large files and provider processing can make publication slower.",
    ],
    questions: [
      {
        question: "Can Delulu schedule YouTube Shorts?",
        answer:
          "Delulu can schedule a vertical YouTube video and returns the resulting video link. YouTube determines whether it qualifies and appears as a Short.",
      },
      {
        question: "Can I set a YouTube title separately?",
        answer:
          "Yes. The YouTube version has a dedicated title. If it is omitted, Delulu derives a short title from the post text, but writing an intentional title is recommended.",
      },
      {
        question: "Can I upload a custom thumbnail?",
        answer:
          "Yes, when the connected channel is verified for custom thumbnails. Use an image thumbnail; Delulu does not use a video timestamp as the YouTube custom thumbnail.",
      },
      {
        question: "Can I publish privately first?",
        answer:
          "Yes. Choose private or unlisted visibility in the YouTube settings, then use a later draft when you are ready for a public release.",
      },
    ],
    related: ["tiktok", "instagram", "linkedin"],
  },
  {
    slug: "threads",
    platform: "THREADS",
    name: "Threads",
    availability: "self-serve",
    workflows: ["Conversation and community", "Visual publishing"],
    eyebrow: "Threads scheduling",
    title: "Schedule Threads posts and connected reply sequences",
    description:
      "Connect a Threads profile, publish text, images, or one video, and turn multiple ordered draft items into a reply sequence.",
    metaTitle: "Threads Post & Thread Scheduler",
    metaDescription:
      "Schedule Threads posts with Delulu. Publish text, up to 10 images or one video, and create ordered reply sequences from one draft.",
    summary: [
      "Threads works best when a post sounds conversational rather than copied from a campaign brief. Delulu gives the platform its own text while keeping its schedule aligned with the rest of the launch.",
      "A draft can be text-only, image-based, or use one video. When the content contains several ordered items, Delulu publishes them sequentially as replies so the result reads as a connected thread.",
    ],
    highlights: [
      { label: "Text", value: "Up to 500 characters per item" },
      { label: "Images", value: "Up to 10" },
      { label: "Sequences", value: "Ordered reply threads" },
      { label: "Reply setting", value: "Provider default" },
    ],
    formats: [
      {
        title: "Text-first posts",
        body: "Publish without media when the message is the point. Each ordered content item is validated against the 500-character limit.",
      },
      {
        title: "Images or one video",
        body: "Attach up to 10 images or one video. Delulu does not mix video and images in the same Threads item.",
      },
      {
        title: "Multi-part threads",
        body: "Write several ordered items and Delulu publishes the later items as replies to the first, preserving the intended sequence.",
      },
    ],
    setup: [
      {
        title: "Connect Threads",
        body: "Open Connected Accounts, choose Threads, and authorize the profile through the provider's connection flow.",
      },
      {
        title: "Write one post or a sequence",
        body: "Select the Threads profile in the composer. Keep one content item for a standalone post or add ordered items for a connected sequence.",
      },
      {
        title: "Review and schedule",
        body: "Check the order, media shape, and text for every item, then schedule or publish the draft. Set any critical reply restrictions directly on the provider after publishing.",
      },
    ],
    reasons: [
      {
        title: "Keep the launch conversational",
        body: "Write a Threads-specific opening and follow-up sequence instead of squeezing formal campaign copy into a social conversation.",
      },
      {
        title: "Prepare the full thought",
        body: "Ordered items let you plan the setup, explanation, proof, and next action before the first post goes live.",
      },
      {
        title: "Keep response planning explicit",
        body: "The complete sequence is visible during review, so the team can decide where the thread should invite discussion and where it should simply explain.",
      },
    ],
    examples: [
      {
        title: "Build-in-public sequence",
        body: "Open with the result, reply with two decisions and one lesson, then finish with the link or question that invites useful discussion.",
      },
      {
        title: "Visual event recap",
        body: "Use an image set for the moments that need context and write a short, conversational caption for the community following along.",
      },
      {
        title: "Coordinated announcement",
        body: "Schedule the Threads conversation at the same time as the formal LinkedIn note and visual Instagram post, each with native copy.",
      },
    ],
    limitations: [
      "Each Threads item is limited to 500 characters in Delulu.",
      "Use up to 10 images or one video per item. Images and video cannot be mixed in the same item.",
      "The current publisher does not forward the draft's reply-control field. Change reply restrictions on Threads after publishing when the campaign requires them.",
      "For a dependable multi-part reply sequence, keep later items to text or one media file. A later multi-image carousel is not currently given the preceding post as its reply target.",
      "A multi-part draft publishes sequentially. If a later provider request fails, the earlier items may already be live.",
    ],
    questions: [
      {
        question: "Can Delulu schedule a Threads thread?",
        answer:
          "Yes. Add multiple ordered content items. Delulu publishes the first item, then publishes each later item as a reply in sequence.",
      },
      {
        question: "Can I schedule a text-only Threads post?",
        answer:
          "Yes. Media is optional, and each text item can contain up to 500 characters.",
      },
      {
        question: "How many images can I add?",
        answer:
          "Delulu validates up to 10 images in a Threads item. A video cannot be mixed into the same item.",
      },
      {
        question: "Can I limit replies?",
        answer:
          "Not through the current Delulu publisher. The draft model contains a reply-control field, but it is not forwarded yet; apply a required restriction on Threads after publishing.",
      },
    ],
    related: ["instagram", "twitter", "bluesky"],
  },
  {
    slug: "twitter",
    platform: "TWITTER",
    name: "X (Twitter)",
    availability: "feature-gated",
    workflows: ["Conversation and community", "Professional updates"],
    eyebrow: "X post and thread scheduling",
    title: "Schedule posts and reply threads for X",
    description:
      "Prepare short posts, image or video updates, and ordered reply threads when X access is enabled for your Delulu workspace.",
    metaTitle: "X Post & Twitter Thread Scheduler",
    metaDescription:
      "Use Delulu to schedule X posts and threads with up to four images or one video per item. Workspace availability may vary.",
    summary: [
      "Delulu's X integration supports short text posts, media posts, and multi-part reply threads. Each item is kept within the platform's 280-character limit.",
      "The current self-serve connection is controlled by a workspace feature flag. If X does not appear in Connected Accounts, the integration is not enabled for that workspace; the landing page does not imply otherwise.",
    ],
    highlights: [
      { label: "Text", value: "280 characters per item" },
      { label: "Images", value: "Up to 4" },
      { label: "Sequences", value: "Reply threads" },
      { label: "Availability", value: "Workspace feature flag" },
    ],
    formats: [
      {
        title: "Text and image posts",
        body: "Publish a text-only update or attach up to four images. The current publisher uploads the media but does not forward image alt text.",
      },
      {
        title: "Single-video posts",
        body: "Attach one video instead of images. Delulu uses the provider's media upload and processing flow before creating the post.",
      },
      {
        title: "Reply threads",
        body: "Add ordered content items to publish the first post and connect every later item as a reply, including media on individual items when valid.",
      },
    ],
    setup: [
      {
        title: "Check workspace availability",
        body: "Open Connected Accounts. If X appears in the dialog, the feature is enabled for your workspace; if it is absent, contact Delulu before planning a campaign around it.",
      },
      {
        title: "Authorize the account",
        body: "Use the provider's authorization screen to approve account read, post, media, and refresh access. Delulu does not collect the account password.",
      },
      {
        title: "Write and review the sequence",
        body: "Select the connected account, keep each item within 280 characters, choose valid media, then schedule or publish. Apply a critical reply restriction on X after publishing.",
      },
    ],
    reasons: [
      {
        title: "Plan the whole thread before posting",
        body: "Review the opening, order, and final next action while the sequence is still a draft rather than improvising replies after the first post is live.",
      },
      {
        title: "Keep announcements coordinated",
        body: "Schedule the concise X version beside fuller LinkedIn and Facebook versions without sharing one unsuitable block of copy.",
      },
      {
        title: "Catch media conflicts early",
        body: "Delulu validates the four-image limit and prevents one item from mixing images with video.",
      },
    ],
    examples: [
      {
        title: "Release thread",
        body: "Lead with the outcome, use replies for the problem and implementation notes, then close with the release link and one clear question.",
      },
      {
        title: "Live-event reminder",
        body: "Schedule a short reminder with one image shortly before the event while the longer details live on Facebook and LinkedIn.",
      },
      {
        title: "Product clip",
        body: "Publish one video with a concise benefit and coordinate the same source asset with the campaign's other video destinations.",
      },
    ],
    limitations: [
      "X connection is feature-gated. It may not appear in every workspace's Connected Accounts dialog.",
      "Each post or thread item is limited to 280 characters.",
      "Use up to four images or one video per item; images and video cannot be mixed in that item.",
      "The current publisher does not forward the draft's reply-restriction field. Change reply permissions on X after publishing when needed.",
      "Threads publish sequentially, so an interruption can leave an earlier part live even if a later reply fails.",
    ],
    questions: [
      {
        question: "Why is X missing from my Connected Accounts dialog?",
        answer:
          "The current self-serve connection is controlled by a Delulu feature flag. If the option is absent, the integration is not enabled for that workspace.",
      },
      {
        question: "Can Delulu schedule an X thread?",
        answer:
          "Yes, when the integration is enabled. Add ordered content items and Delulu publishes the later items as replies to the first.",
      },
      {
        question: "Can every item in a thread have media?",
        answer:
          "Each item can include valid media independently: up to four images or one video, without mixing images and video in the same item.",
      },
      {
        question: "Can I control who replies?",
        answer:
          "Not through the current publisher. The draft model contains a reply-restriction field, but it is not forwarded yet; apply the restriction on X after publishing.",
      },
    ],
    related: ["threads", "bluesky", "linkedin"],
  },
  {
    slug: "pinterest",
    platform: "PINTEREST",
    name: "Pinterest",
    availability: "limited-access",
    workflows: ["Visual publishing"],
    eyebrow: "Pinterest image publishing",
    title: "Prepare image Pins from the same campaign workspace",
    description:
      "Publish an image Pin with a title and description through Delulu's implemented Pinterest provider, with honest limits on current destination control.",
    metaTitle: "Pinterest Image Pin Publisher",
    metaDescription:
      "Learn how Delulu's Pinterest integration publishes image Pins, handles titles and descriptions, and what to verify about connection and board selection.",
    summary: [
      "Delulu implements Pinterest authorization and image-Pin publishing in its provider registry. The dependable current workflow takes the first valid image, builds a title and description from the draft, and publishes it to an available board.",
      "Pinterest is not currently shown in the standard self-serve Connected Accounts dialog. Treat it as limited-access: confirm that your workspace has a Pinterest connection path before building a production calendar around it.",
    ],
    highlights: [
      { label: "Format", value: "Image Pin" },
      { label: "Description", value: "Up to 500 characters" },
      { label: "Title", value: "Derived up to 100 characters" },
      { label: "Availability", value: "Not in the standard connect dialog" },
    ],
    formats: [
      {
        title: "Single image Pins",
        body: "The current publisher uses the first valid image in the draft to create a Pin. Use a deliberate primary image rather than relying on a multi-image order.",
      },
      {
        title: "Title and description",
        body: "Delulu derives a short Pin title from the post text and sends the description within its 500-character validation limit.",
      },
      {
        title: "Board destination",
        body: "The provider reads available boards and currently publishes to the first returned board. Confirm that destination before using the integration for a campaign.",
      },
    ],
    setup: [
      {
        title: "Confirm access first",
        body: "Because Pinterest is not exposed in the standard connection dialog, verify the connection path with Delulu for your workspace before preparing scheduled Pins.",
      },
      {
        title: "Authorize Pinterest",
        body: "Where access is available, complete the provider authorization flow and confirm that the intended account has at least one board.",
      },
      {
        title: "Use a clear primary image",
        body: "Prepare the Pinterest-specific text and place the image you want published first. Verify the target board and resulting Pin during early campaign testing.",
      },
    ],
    reasons: [
      {
        title: "Reuse campaign visuals intentionally",
        body: "Turn a strong product, tutorial, or editorial image into a Pin without recreating the campaign schedule elsewhere.",
      },
      {
        title: "Write a destination-specific description",
        body: "Keep Pinterest's search and discovery context separate from short social captions while sharing the core asset and launch date.",
      },
      {
        title: "Expose current constraints before launch",
        body: "The page makes limited availability and board selection behavior clear so a team can test the workflow instead of assuming parity with fully self-serve integrations.",
      },
    ],
    examples: [
      {
        title: "Evergreen tutorial Pin",
        body: "Use a vertical instructional image and a concise description that explains the result, then link the campaign asset to the wider editorial plan.",
      },
      {
        title: "Product collection hero",
        body: "Choose the strongest collection image as the first and only publishing image, then verify the destination board before scheduling more Pins.",
      },
      {
        title: "Blog visual distribution",
        body: "Adapt the article's leading image and description for Pinterest while the same publication date drives announcements elsewhere.",
      },
    ],
    limitations: [
      "Pinterest is implemented in Delulu's provider registry but is not exposed in the current standard self-serve connection dialog.",
      "The current publisher creates one image Pin from the first valid image; it does not publish video Pins.",
      "Although the editor model can hold several images, the publishing implementation uses only the first valid image.",
      "The current provider selects the first available board. Confirm the destination before relying on scheduled publishing.",
    ],
    questions: [
      {
        question: "Can I connect Pinterest from every Delulu workspace?",
        answer:
          "No. The provider is implemented, but Pinterest is not currently listed in the standard self-serve connection dialog. Confirm workspace access first.",
      },
      {
        question: "Can Delulu publish video Pins?",
        answer: "No. The current Pinterest publisher requires an image.",
      },
      {
        question: "What happens if I add several images?",
        answer:
          "The current publishing path uses the first valid image. Put the intended Pin image first and do not assume a carousel will be created.",
      },
      {
        question: "Can I choose a Pinterest board?",
        answer:
          "The content model includes a board field, but the current publisher uses the first available board. Verify the destination during testing.",
      },
    ],
    related: ["instagram", "facebook", "linkedin"],
  },
  {
    slug: "bluesky",
    platform: "BLUESKY",
    name: "Bluesky",
    availability: "limited-access",
    workflows: ["Conversation and community"],
    eyebrow: "Bluesky publishing",
    title: "Publish Bluesky posts and reply threads from Delulu",
    description:
      "Use Delulu's implemented Bluesky provider for text, image posts, and ordered reply threads, with a limited-access connection today.",
    metaTitle: "Bluesky Post & Thread Publisher",
    metaDescription:
      "Learn how Delulu publishes Bluesky text, images, and reply threads, including the 300-character limit and current connection availability.",
    summary: [
      "Delulu's Bluesky provider implements authorization, text and media publishing, and ordered reply threads. It is designed for concise community updates that need their own version within a larger campaign.",
      "Bluesky is not currently displayed in the standard self-serve connection dialog. Confirm that a connection is available in your workspace before depending on it for scheduled launches.",
    ],
    highlights: [
      { label: "Text", value: "Up to 300 characters per item" },
      { label: "Images", value: "Up to 4" },
      { label: "Sequences", value: "Ordered reply threads" },
      { label: "Availability", value: "Not in the standard connect dialog" },
    ],
    formats: [
      {
        title: "Text-first updates",
        body: "Publish a concise update without media. Each item is validated against Delulu's 300-character Bluesky limit.",
      },
      {
        title: "Image posts",
        body: "Attach up to four images. The current publisher derives each image description from the first 100 characters of the post text rather than forwarding per-image alt text.",
      },
      {
        title: "Reply threads",
        body: "Add multiple ordered content items. Delulu publishes the first record and uses its reference when creating each following reply.",
      },
    ],
    setup: [
      {
        title: "Confirm workspace access",
        body: "Bluesky is implemented but not shown in the current standard connection dialog. Confirm that the integration is enabled before planning posts around it.",
      },
      {
        title: "Authorize the profile",
        body: "Where access is available, complete the Bluesky authorization flow and check the connected profile shown in Delulu.",
      },
      {
        title: "Create a post or sequence",
        body: "Write one 300-character item or several ordered items, add up to four images per item, and publish or schedule after an initial connection test.",
      },
    ],
    reasons: [
      {
        title: "Meet the community with native copy",
        body: "Use a concise Bluesky version instead of automatically repeating a longer announcement from another network.",
      },
      {
        title: "Prepare connected explanations",
        body: "Reply threads let a team review the complete sequence before the first item goes live.",
      },
      {
        title: "Keep emerging-channel work visible",
        body: "Place the Bluesky version beside established channels on the same campaign calendar when the connection is available.",
      },
    ],
    examples: [
      {
        title: "Open-source release thread",
        body: "Use the first item for the result, replies for the design tradeoffs, and the final item for the repository or release link.",
      },
      {
        title: "Community question",
        body: "Schedule one concise question with a relevant image and keep the other campaign destinations focused on the formal announcement.",
      },
      {
        title: "Event notes",
        body: "Prepare a short sequence of takeaways, review the order, and publish them as connected replies after the session.",
      },
    ],
    limitations: [
      "Bluesky is implemented in Delulu's registry but is not currently shown in the standard self-serve connection dialog.",
      "Each post or reply item is limited to 300 characters and up to four images.",
      "The provider code accepts media records, but campaign-critical video behavior should be tested before use; text and image publishing are the dependable paths described here.",
      "The current publisher does not forward the draft's disable-replies field. Change reply permissions on Bluesky after publishing when needed.",
      "A thread publishes sequentially, so an error on a later reply can leave earlier items live.",
    ],
    questions: [
      {
        question: "Can every Delulu workspace connect Bluesky?",
        answer:
          "No. The provider is implemented, but the current standard connection dialog does not expose Bluesky. Confirm access for your workspace.",
      },
      {
        question: "Can Delulu publish a Bluesky thread?",
        answer:
          "Yes, where a connection is available. Ordered draft items publish sequentially as replies.",
      },
      {
        question: "How many images can I add?",
        answer:
          "Delulu validates up to four images per Bluesky item. The current publisher derives image descriptions from the post text instead of forwarding per-image alt text.",
      },
      {
        question: "Does the page promise Bluesky video publishing?",
        answer:
          "No. The implemented media path needs campaign-level video verification, so this page describes text and image publishing as the dependable workflow.",
      },
    ],
    related: ["threads", "twitter", "farcaster"],
  },
  {
    slug: "farcaster",
    platform: "FARCASTER",
    name: "Farcaster",
    availability: "limited-access",
    workflows: ["Conversation and community"],
    eyebrow: "Farcaster cast publishing",
    title: "Prepare concise Farcaster casts and channel posts",
    description:
      "Use Delulu's implemented Farcaster provider for short casts with image embeds and an optional channel, after confirming workspace access.",
    metaTitle: "Farcaster Cast & Channel Publisher",
    metaDescription:
      "Learn how Delulu publishes Farcaster casts with up to 320 characters, two image embeds, and an optional channel, plus current access limits.",
    summary: [
      "Delulu's Farcaster provider publishes concise casts through an approved signer and can attach image URLs as embeds. A draft can optionally target a channel instead of the home feed.",
      "The provider is implemented, but the current account button is disabled in the standard connection dialog. Confirm a supported signer-approval path for your workspace before planning production publishing.",
    ],
    highlights: [
      { label: "Text", value: "Up to 320 characters" },
      { label: "Media", value: "Up to 2 image embeds" },
      { label: "Destination", value: "Home feed or optional channel" },
      { label: "Availability", value: "Standard connect button disabled" },
    ],
    formats: [
      {
        title: "Text casts",
        body: "Publish a cast of up to 320 characters when the message does not need media.",
      },
      {
        title: "Image URL embeds",
        body: "Attach up to two images. Delulu sends their URLs as embeds rather than uploading the files directly to Farcaster.",
      },
      {
        title: "Channel casts",
        body: "Add an optional channel identifier to target a relevant channel; leave it blank to use the profile's home feed.",
      },
    ],
    setup: [
      {
        title: "Confirm limited access",
        body: "The standard Farcaster connect button is currently disabled. Confirm the available connection path with Delulu before creating scheduled drafts.",
      },
      {
        title: "Approve the signer",
        body: "Where access is available, complete the signer-approval flow in the compatible Farcaster client and return to the connected-account view.",
      },
      {
        title: "Write and test a cast",
        body: "Keep the text within 320 characters, add no more than two image embeds, optionally specify a channel, and test one live cast before scheduling a series.",
      },
    ],
    reasons: [
      {
        title: "Keep community posts in the campaign plan",
        body: "When access is enabled, a Farcaster-specific cast can share the launch date without inheriting unsuitable copy from another destination.",
      },
      {
        title: "Target a relevant channel",
        body: "The optional channel field lets a team decide whether a cast belongs in the home feed or a focused community context.",
      },
      {
        title: "Work within a clear compact format",
        body: "The text and embed limits are visible during planning, which helps writers make a complete point without relying on an overlong draft.",
      },
    ],
    examples: [
      {
        title: "Developer release cast",
        body: "Summarize what changed, add one product image, and target a relevant channel when the audience context is clear.",
      },
      {
        title: "Community prompt",
        body: "Ask one specific question in the home feed and use the campaign calendar to avoid colliding with a larger announcement.",
      },
      {
        title: "Event artifact",
        body: "Share up to two image embeds from an event with a short takeaway and a channel that matches the topic.",
      },
    ],
    limitations: [
      "The standard Farcaster connection button is currently disabled even though the provider and publisher are implemented.",
      "Casts are limited to 320 characters and up to two image URL embeds.",
      "Delulu does not upload Farcaster media directly and does not describe video publishing as supported.",
      "Connection uses a signer-approval flow rather than a conventional password or standard OAuth callback.",
    ],
    questions: [
      {
        question: "Can I connect Farcaster from the standard dialog?",
        answer:
          "Not currently. The button is disabled in the standard connection dialog, so confirm a supported access path with Delulu first.",
      },
      {
        question: "Can Delulu publish to a Farcaster channel?",
        answer:
          "The provider settings include an optional channel identifier. Leave it blank for the home feed or specify an available channel when access is enabled.",
      },
      {
        question: "Does Delulu upload Farcaster images?",
        answer:
          "No. The current publisher attaches up to two accessible image URLs as embeds.",
      },
      {
        question: "Can Delulu publish Farcaster videos?",
        answer:
          "No video workflow is claimed. The implemented publisher is for text casts and image URL embeds.",
      },
    ],
    related: ["bluesky", "threads", "twitter"],
  },
] as const satisfies readonly IntegrationPageDefinition[];

export type IntegrationSlug = (typeof integrationPages)[number]["slug"];

export const getIntegrationPage = (
  slug: string
): IntegrationPageDefinition | undefined =>
  (integrationPages as readonly IntegrationPageDefinition[]).find(
    (integration) => integration.slug === slug
  );

export const availabilityLabels = {
  "self-serve": "Self-serve connection",
  "feature-gated": "Workspace availability varies",
  "limited-access": "Limited connection access",
} as const satisfies Record<IntegrationPageDefinition["availability"], string>;

export const workflowDescriptions = {
  "Short-form video":
    "Coordinate vertical video while preserving each platform's title, audience, and consent settings.",
  "Visual publishing":
    "Plan image-led posts, carousels, and media campaigns with the right format for each destination.",
  "Professional updates":
    "Turn campaign material into clear company, founder, and professional-audience updates.",
  "Conversation and community":
    "Prepare concise posts, reply sequences, and community-specific versions before they go live.",
} as const satisfies Record<IntegrationWorkflow, string>;

export const integrationWorkflows = Object.keys(
  workflowDescriptions
) as IntegrationWorkflow[];

const relatedFeatureSlugs: Record<IntegrationSlug, readonly FeatureSlug[]> = {
  instagram: [
    "multi-platform-publishing",
    "content-calendar",
    "instagram-dm-automation",
    "social-analytics",
  ],
  facebook: ["multi-platform-publishing", "content-calendar", "team-approvals"],
  linkedin: ["multi-platform-publishing", "content-calendar", "team-approvals"],
  tiktok: [
    "multi-platform-publishing",
    "content-calendar",
    "bulk-video-scheduling",
  ],
  youtube: ["multi-platform-publishing", "content-calendar", "team-approvals"],
  threads: [
    "multi-platform-publishing",
    "content-calendar",
    "platform-specific-content",
  ],
  twitter: [
    "multi-platform-publishing",
    "content-calendar",
    "social-media-api",
  ],
  pinterest: [
    "multi-platform-publishing",
    "content-calendar",
    "platform-specific-content",
  ],
  bluesky: [
    "multi-platform-publishing",
    "content-calendar",
    "social-media-api",
  ],
  farcaster: [
    "multi-platform-publishing",
    "content-calendar",
    "social-media-api",
  ],
};

export const getRelatedFeatures = (slug: IntegrationSlug) => {
  const selected = new Set(relatedFeatureSlugs[slug]);
  return features.filter((feature) => selected.has(feature.slug));
};
