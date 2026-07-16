export type TextToolMode = "count" | "line-break" | "bold" | "italic";

export interface TextAnalysis {
  characters: number;
  words: number;
  hashtags: number;
  mentions: number;
  lines: number;
}

export interface TextToolFaq {
  question: string;
  answer: string;
}

export interface TextToolDefinition {
  slug: string;
  title: string;
  description: string;
  metadataTitle: string;
  metaDescription: string;
  keywords: string[];
  mode: TextToolMode;
  limit?: number;
  limitLabel?: string;
  limitSource?: string;
  placeholder: string;
  intro: string;
  example: string;
  tips: string[];
  faq: TextToolFaq[];
  composerHandoff: boolean;
}

export interface TextToolUiCopy {
  inputLabel: string;
  exampleAction: string;
  copyAction: string;
  outputLabel?: string;
  howToHeading: string;
  exampleHeading: string;
}

const LINE_BREAK_PATTERN = /\r\n|\r|\n/;

const COUNT_SPECIFIC_FAQ: Record<string, TextToolFaq> = {
  "Instagram caption": {
    question:
      "Do Instagram hashtags count toward the 2,200-character caption limit?",
    answer:
      "Yes. Hashtags, spaces, line breaks, mentions, emoji, and punctuation are all part of the caption text and use the same character budget.",
  },
  "Instagram bio": {
    question:
      "Does the Instagram website link use part of the 150-character bio?",
    answer:
      "Instagram manages profile links separately from the bio field. Text you type into the bio itself uses the 150-character budget shown here.",
  },
  "LinkedIn post": {
    question: "Should a LinkedIn post use all 3,000 characters?",
    answer:
      "Not necessarily. The limit is a ceiling, not a target. Use the space needed to make the insight clear, and keep the opening lines strong enough to invite expansion.",
  },
  "YouTube video title": {
    question: "Will every 100-character YouTube title display in full?",
    answer:
      "No. YouTube can shorten a title in search, recommendations, or smaller screens even when it is valid, so put the most specific words early.",
  },
  "YouTube video description": {
    question:
      "Do YouTube chapters count toward the 5,000-character description limit?",
    answer:
      "Yes. Timestamps, chapter names, credits, hashtags, links, and the summary all share the same description character budget.",
  },
  "Facebook post": {
    question: "Is a 63,206-character Facebook post a good target?",
    answer:
      "No. It is the publishing ceiling used by Delulu, not a recommended length. Most feed posts should communicate their value much earlier.",
  },
  "TikTok caption": {
    question: "Do TikTok hashtags and mentions use caption characters?",
    answer:
      "Yes. Hashtags, mentions, spaces, emoji, and normal caption text all contribute to the 2,200-character working limit.",
  },
  "social post": {
    question:
      "Can this general counter compare drafts for different platforms?",
    answer:
      "Yes. It applies no maximum, so you can measure a reusable base draft before opening a platform-specific counter for final validation.",
  },
  text: {
    question: "How does the word counter treat hyphenated words?",
    answer:
      "A connected term such as “well-planned” counts as one word. Standalone punctuation and emoji do not add to the word total.",
  },
  "hashtag set": {
    question: "Does punctuation after a hashtag stop it from being counted?",
    answer:
      "No. A tag such as #launch, still counts as one hashtag. The counter reads letters, numbers, and underscores after the # symbol.",
  },
};

const countFaq = (
  name: string,
  subject: string,
  limit?: number,
  detail = "A typical emoji counts as one character here. The app where you publish may count combined emoji differently."
): TextToolFaq[] => [
  COUNT_SPECIFIC_FAQ[subject] ?? {
    question: `How should I use the ${name}?`,
    answer: `Use it to check the length and structure of your ${subject} before moving the draft into its destination editor.`,
  },
  {
    question: `What does the ${name} count?`,
    answer: `It reports live characters, words, hashtags, mentions, and lines for your ${subject}. ${detail}`,
  },
  {
    question: limit
      ? `What is the ${subject} character limit?`
      : `Does the ${name} enforce a character limit?`,
    answer: limit
      ? `The counter uses a ${limit.toLocaleString("en-US")}-character working limit and shows exactly how many characters remain.`
      : "No. This general counter measures the text without imposing a platform-specific maximum.",
  },
  {
    question: `Are spaces and line breaks included in the ${name}?`,
    answer:
      "Yes. Spaces, punctuation, and line breaks all count as characters because they are part of the text you will publish.",
  },
  {
    question: `Does the ${name} upload or save my text?`,
    answer:
      "No. Counting happens entirely in your browser. The text is not sent to Delulu or stored anywhere.",
  },
  {
    question: `How are hashtags and mentions found in my ${subject}?`,
    answer:
      "The counter reads space-separated words beginning with # as hashtags and words beginning with @ as mentions, including letters, numbers, and underscores.",
  },
  {
    question: `Can I use the ${name} on a phone?`,
    answer:
      "Yes. It works in modern mobile and desktop browsers, with the same live counts and copy controls.",
  },
  {
    question: `What should I do when my ${subject} is over the limit?`,
    answer:
      "Start by removing repeated setup, filler words, or duplicate hashtags. Keep the strongest hook and the clearest next action.",
  },
];

const transformFaq = (
  name: string,
  effect: string,
  compatibility: string
): TextToolFaq[] => [
  {
    question: `How does the ${name} work?`,
    answer: `It changes the text ${effect}. Nothing is uploaded or saved.`,
  },
  {
    question: `Can I copy the result from the ${name}?`,
    answer:
      "Yes. Copy the finished text, then paste it into your social post, bio, message, or document.",
  },
  {
    question: `Where does text from the ${name} work?`,
    answer: compatibility,
  },
  {
    question: `Does the ${name} change hashtags or punctuation?`,
    answer:
      "Punctuation and spacing stay in place. Bold and italic formatting changes supported letters and numbers; line-break formatting only fills blank lines.",
  },
  {
    question: `Is the ${name} free and private?`,
    answer:
      "Yes. It is free, requires no account, has no visible usage limit, and does not send your text anywhere.",
  },
  {
    question: "Will transformed text affect my character limit?",
    answer:
      "It can. Styled characters may be counted differently by the destination app, so check the live character total before publishing.",
  },
  {
    question: `Can screen readers read the ${name} result?`,
    answer:
      "Plain text is usually the most accessible choice. Use styled text sparingly, and never rely on styling alone to communicate meaning.",
  },
];

export const textTools: TextToolDefinition[] = [
  {
    slug: "instagram-caption-character-counter",
    title: "Instagram Caption Character Counter",
    description:
      "Count Instagram caption characters, words, hashtags, and mentions live against the 2,200-character limit.",
    metadataTitle: "Instagram Caption Character Counter – 2,200 Limit",
    metaDescription:
      "Check an Instagram caption against the 2,200-character limit with live word, hashtag, mention, and remaining counts. Free and private.",
    keywords: [
      "instagram caption character counter",
      "instagram caption limit",
      "instagram word counter",
    ],
    mode: "count",
    limit: 2200,
    limitLabel: "Instagram caption limit",
    limitSource:
      "https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/content-publishing",
    placeholder: "Paste or write your Instagram caption…",
    intro:
      "A strong Instagram caption needs room for the hook, useful context, hashtags, and a clear next step. This counter shows every part of that budget as you write, so you can tighten a caption before the publishing screen rejects it or hides the important part behind “more.”",
    example:
      "New drop, same big energy. Which color would you pick? ✨\n\n#newrelease #behindthescenes",
    tips: [
      "Put the hook in the opening line.",
      "Keep hashtags relevant instead of repeating broad tags.",
      "Leave room for mentions and disclosure text when a post needs them.",
    ],
    faq: countFaq("Instagram caption counter", "Instagram caption", 2200),
    composerHandoff: true,
  },
  {
    slug: "instagram-bio-character-counter",
    title: "Instagram Bio Character Counter",
    description:
      "Shape an Instagram bio with live counts against the 150-character profile limit.",
    metadataTitle: "Instagram Bio Character Counter – 150 Character Limit",
    metaDescription:
      "Write an Instagram bio that fits the 150-character limit. Count characters, words, hashtags, and mentions privately in your browser.",
    keywords: [
      "instagram bio character counter",
      "instagram bio limit",
      "instagram bio word counter",
    ],
    mode: "count",
    limit: 150,
    limitLabel: "Instagram bio limit",
    limitSource: "https://www.facebook.com/help/instagram/728994388226960/",
    placeholder: "Creator, studio, or business in one clear sentence…",
    intro:
      "An Instagram bio has very little space to explain who you help, what you make, and why someone should follow. Use this focused 150-character counter to test concise profile descriptions, calls to action, category language, hashtags, and mentions without sending the draft anywhere.",
    example:
      "Helping small teams publish better social content ✨\nWeekly ideas ↓",
    tips: [
      "Lead with what you do or who you help.",
      "Use one clear action rather than several competing asks.",
      "Check that decorative symbols still leave enough room for meaning.",
    ],
    faq: countFaq("Instagram bio counter", "Instagram bio", 150),
    composerHandoff: false,
  },
  {
    slug: "linkedin-post-character-counter",
    title: "LinkedIn Post Character Counter",
    description:
      "Measure LinkedIn post characters, words, hashtags, and mentions against the 3,000-character limit.",
    metadataTitle: "LinkedIn Post Character Counter – 3,000 Limit",
    metaDescription:
      "Count a LinkedIn post live against 3,000 characters, including words, hashtags, mentions, and remaining space. No signup required.",
    keywords: [
      "linkedin character counter",
      "linkedin post limit",
      "linkedin word counter",
    ],
    mode: "count",
    limit: 3000,
    limitLabel: "LinkedIn post limit",
    limitSource:
      "https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api",
    placeholder: "Write the insight, story, or lesson you want to share…",
    intro:
      "LinkedIn gives long-form posts room to breathe, but clarity still matters more than filling the full allowance. This live counter helps you balance an opening hook, readable paragraphs, proof, mentions, and a useful closing question while staying inside the publishing limit.",
    example:
      "The best process change we made this quarter was also the smallest.\n\nWe replaced one weekly status meeting with a written decision log.",
    tips: [
      "Make the first two lines useful on their own.",
      "Break dense reasoning into short, scannable paragraphs.",
      "Use mentions only when the person or organization is relevant.",
    ],
    faq: countFaq("LinkedIn post counter", "LinkedIn post", 3000),
    composerHandoff: true,
  },
  {
    slug: "youtube-title-character-counter",
    title: "YouTube Title Character Counter",
    description:
      "Draft a YouTube video title with a live count against the official 100-character limit.",
    metadataTitle: "YouTube Title Character Counter – 100 Character Limit",
    metaDescription:
      "Check a YouTube video title against the 100-character maximum with instant character and word counts. Free, private, and no signup.",
    keywords: [
      "youtube title character counter",
      "youtube title limit",
      "youtube title length checker",
    ],
    mode: "count",
    limit: 100,
    limitLabel: "YouTube title limit",
    limitSource: "https://support.google.com/youtube/answer/57407",
    placeholder: "Write a clear, specific video title…",
    intro:
      "YouTube titles need to set an accurate expectation and earn attention in a compact search result. This counter uses YouTube’s 100-character maximum and lets you compare concise title ideas without uploading a video, signing in, or sharing the draft.",
    example: "I Tested 5 Content Workflows — Here’s the One That Saved 6 Hours",
    tips: [
      "Put the specific topic before secondary context.",
      "Avoid promises the video does not deliver.",
      "Read the title beside the thumbnail idea to remove repetition.",
    ],
    faq: countFaq("YouTube title counter", "YouTube video title", 100),
    composerHandoff: false,
  },
  {
    slug: "youtube-description-character-counter",
    title: "YouTube Description Character Counter",
    description:
      "Count YouTube description characters, words, hashtags, and mentions against the 5,000-character maximum.",
    metadataTitle: "YouTube Description Character Counter – 5,000 Limit",
    metaDescription:
      "Write a YouTube description within the 5,000-character limit with live word, hashtag, mention, and remaining counts.",
    keywords: [
      "youtube description character counter",
      "youtube description limit",
      "youtube description word counter",
    ],
    mode: "count",
    limit: 5000,
    limitLabel: "YouTube description limit",
    limitSource: "https://support.google.com/youtube/answer/12948449",
    placeholder: "Summarize the video, then add chapters, credits, and links…",
    intro:
      "A useful YouTube description can summarize the video, surface key terms naturally, add chapters, credit collaborators, and point viewers to the next step. Track the official 5,000-character maximum here while keeping the opening lines focused on what viewers will get.",
    example:
      "In this video, we build a repeatable weekly content plan from one customer interview.\n\n00:00 Why the old workflow failed\n01:42 The new system",
    tips: [
      "Use the opening lines for a unique video summary.",
      "Put chapter timestamps in a consistent format.",
      "Keep credits and important links clearly labeled.",
    ],
    faq: countFaq(
      "YouTube description counter",
      "YouTube video description",
      5000
    ),
    composerHandoff: false,
  },
  {
    slug: "facebook-post-character-counter",
    title: "Facebook Post Character Counter",
    description:
      "Measure a Facebook post against the 63,206-character publishing limit with live writing stats.",
    metadataTitle: "Facebook Post Character Counter – 63,206 Limit",
    metaDescription:
      "Count Facebook post characters, words, hashtags, mentions, and remaining space against the 63,206-character publishing limit.",
    keywords: [
      "facebook character counter",
      "facebook post character limit",
      "facebook word counter",
    ],
    mode: "count",
    limit: 63_206,
    limitLabel: "Facebook post limit",
    placeholder: "Write your Facebook post…",
    intro:
      "Facebook accepts very long post text, but most updates benefit from a clear point and an easy-to-scan structure. This counter mirrors Delulu’s current Facebook publishing constraint and gives you a private workspace for polishing announcements, community updates, and stories before posting.",
    example:
      "We’re opening the studio this Saturday. Drop in from 10–2 for demos, questions, and a first look at what we’ve been building.",
    tips: [
      "State the news or value early.",
      "Use line breaks for dates, locations, and actions.",
      "Preview links separately so the post text does not repeat the headline.",
    ],
    faq: countFaq("Facebook post counter", "Facebook post", 63_206),
    composerHandoff: true,
  },
  {
    slug: "tiktok-caption-character-counter",
    title: "TikTok Caption Character Counter",
    description:
      "Check TikTok caption characters, words, hashtags, and mentions against the 2,200-character limit.",
    metadataTitle: "TikTok Caption Character Counter – 2,200 Limit",
    metaDescription:
      "Count a TikTok caption live against 2,200 characters, including hashtags, mentions, words, and remaining space. Free and private.",
    keywords: [
      "tiktok caption character counter",
      "tiktok caption limit",
      "tiktok hashtag counter",
    ],
    mode: "count",
    limit: 2200,
    limitLabel: "TikTok caption limit",
    placeholder: "Add context, a hook, and relevant hashtags…",
    intro:
      "TikTok captions can add context that the video does not carry on its own, make a series easier to follow, and help viewers understand the next action. This private counter follows Delulu’s current TikTok publishing constraint and tracks hashtags and mentions alongside the total.",
    example:
      "The tiny framing change that made this shot feel intentional. Save this for your next product video. #filmtips #contentcreator",
    tips: [
      "Let the caption add context instead of narrating the whole video.",
      "Use searchable phrases naturally.",
      "Choose a small set of directly relevant hashtags.",
    ],
    faq: countFaq("TikTok caption counter", "TikTok caption", 2200),
    composerHandoff: true,
  },
  {
    slug: "social-media-character-counter",
    title: "Social Media Character Counter",
    description:
      "Count characters, words, hashtags, mentions, and lines for any social post without a fixed limit.",
    metadataTitle: "Social Media Character Counter – Characters & Words",
    metaDescription:
      "Count characters, words, hashtags, mentions, and lines in any social post. Instant results, no signup, and no fixed platform limit.",
    keywords: [
      "social media character counter",
      "social post length checker",
      "caption character count",
    ],
    mode: "count",
    placeholder: "Paste a caption or social post from any platform…",
    intro:
      "Sometimes you need clean writing statistics before you have chosen a destination platform. This general social media counter measures characters, words, hashtags, mentions, and lines without imposing a maximum, making it useful for comparing drafts or adapting one idea across channels.",
    example:
      "One idea, three formats: a short hook, a useful example, and a question that starts a real conversation. #contentstrategy",
    tips: [
      "Compare alternate hooks by length and clarity.",
      "Keep a reusable core draft before adapting platform details.",
      "Count hashtags as a quality check, not a target to maximize.",
    ],
    faq: countFaq("social media character counter", "social post"),
    composerHandoff: true,
  },
  {
    slug: "word-counter",
    title: "Free Word Counter",
    description:
      "See word, character, hashtag, mention, and line totals instantly while your draft stays private.",
    metadataTitle: "Free Word Counter – Words, Characters & Lines",
    metaDescription:
      "Count words, characters, lines, hashtags, and mentions instantly. Free private word counter that works entirely in your browser.",
    keywords: [
      "free word counter",
      "online word count",
      "character and word counter",
    ],
    mode: "count",
    placeholder: "Paste any text to count its words…",
    intro:
      "This straightforward word counter gives writers a quick view of length without uploading the draft. It measures words alongside characters, lines, hashtags, and mentions, so it works equally well for an article outline, campaign note, email, caption, or short script.",
    example:
      "Clear writing usually comes from one useful idea, a concrete example, and the confidence to remove everything else.",
    tips: [
      "Use the count to fit a real format, not as a quality score.",
      "Read the draft aloud after trimming it.",
      "Keep examples when they explain more than extra adjectives would.",
    ],
    faq: countFaq("word counter", "text"),
    composerHandoff: false,
  },
  {
    slug: "hashtag-counter",
    title: "Free Hashtag Counter",
    description:
      "Count hashtags alongside characters, words, mentions, and lines as you shape a social caption.",
    metadataTitle: "Free Hashtag Counter – Count Tags in Any Caption",
    metaDescription:
      "Count hashtags in any caption or social post instantly, with live character, word, mention, and line totals. Free and private.",
    keywords: [
      "hashtag counter",
      "count hashtags",
      "instagram hashtag counter",
    ],
    mode: "count",
    placeholder: "Paste a caption with hashtags…",
    intro:
      "A hashtag counter is most useful as an editing check: it shows whether tags are supporting the post or crowding out the message. Paste a draft to count space-separated hashtags, mentions, words, lines, and total characters without sending the content to a server.",
    example:
      "A practical guide to better launch notes. #productmarketing #launchstrategy #writingtips",
    tips: [
      "Prefer tags that precisely describe the post.",
      "Remove near-duplicates that target the same intent.",
      "Keep the caption readable even when every hashtag is removed.",
    ],
    faq: countFaq("hashtag counter", "hashtag set"),
    composerHandoff: true,
  },
  {
    slug: "line-break-generator",
    title: "Social Media Line Break Generator",
    description:
      "Keep intentional blank lines when you copy and paste a social caption.",
    metadataTitle:
      "Social Media Line Break Generator – Preserve Caption Spacing",
    metaDescription:
      "Keep blank lines when you copy and paste a social caption. Format the spacing instantly with no signup and nothing uploaded.",
    keywords: [
      "social media line break generator",
      "instagram line breaks",
      "caption spacing tool",
    ],
    mode: "line-break",
    placeholder: "Write your caption with blank lines between sections…",
    intro:
      "Blank lines make longer captions easier to scan, but some editors collapse empty paragraphs after paste or publish. This generator keeps spacing on otherwise empty lines while leaving your words untouched.",
    example:
      "A clear opening line.\n\nOne supporting detail.\n\nA simple next step.",
    tips: [
      "Use blank lines to separate ideas, not every sentence.",
      "Preview the pasted result in the destination app.",
      "Regenerate after editing so every empty line gets a spacer.",
    ],
    faq: transformFaq(
      "line break generator",
      "by placing a blank spacer on empty lines",
      "The result works in most social caption and bio editors. Always preview before publishing because some apps handle blank space differently."
    ),
    composerHandoff: true,
  },
  {
    slug: "bold-text-generator",
    title: "Bold Text Generator",
    description:
      "Turn letters and numbers into copyable bold text for short social highlights.",
    metadataTitle: "Bold Text Generator – Copy & Paste Bold Text",
    metaDescription:
      "Create copyable bold text for social posts and bios. See the result instantly, with no signup and nothing uploaded.",
    keywords: [
      "bold text generator",
      "bold text copy paste",
      "bold font copy paste",
    ],
    mode: "bold",
    placeholder: "Type the words you want to emphasize…",
    intro:
      "Many social editors do not offer a bold button. Use this generator for a short heading or key phrase, then copy the result while keeping the rest of your post in accessible plain text.",
    example: "New this week: practical content systems",
    tips: [
      "Style one short phrase rather than a full caption.",
      "Keep the unstyled meaning clear for accessibility.",
      "Check the pasted result on the device your audience uses.",
    ],
    faq: transformFaq(
      "bold text generator",
      "by changing supported letters and numbers into copyable bold text",
      "Copyable bold text works in many bios, captions, messages, and documents, but its appearance depends on the app and device."
    ),
    composerHandoff: true,
  },
  {
    slug: "italic-text-generator",
    title: "Italic Text Generator",
    description:
      "Create copyable italic text for restrained emphasis in captions, bios, and messages.",
    metadataTitle: "Italic Text Generator – Copy & Paste Italic Text",
    metaDescription:
      "Create copyable italic text for social posts and bios. See the result instantly, with no signup and nothing uploaded.",
    keywords: [
      "italic text generator",
      "italic text copy paste",
      "italic font copy paste",
    ],
    mode: "italic",
    placeholder: "Type a short phrase to italicize…",
    intro:
      "When a social editor has no italic button, copyable italic letters can add light emphasis that survives copy and paste. Punctuation, spaces, and emoji stay unchanged.",
    example: "A small note worth remembering",
    tips: [
      "Reserve italics for short asides or emphasis.",
      "Do not style critical instructions that must be universally readable.",
      "Check the final character count after conversion.",
    ],
    faq: transformFaq(
      "italic text generator",
      "by changing supported letters into copyable italic text",
      "Copyable italic text displays in many modern social apps and browsers. Some fonts may display it differently, so preview the final post."
    ),
    composerHandoff: true,
  },
];

const TEXT_TOOL_UI_COPY: Record<string, TextToolUiCopy> = {
  "instagram-caption-character-counter": {
    inputLabel: "Instagram caption",
    exampleAction: "Load caption example",
    copyAction: "Copy caption",
    howToHeading: "Check an Instagram caption before posting",
    exampleHeading: "Instagram caption example",
  },
  "instagram-bio-character-counter": {
    inputLabel: "Instagram bio",
    exampleAction: "Load bio example",
    copyAction: "Copy bio",
    howToHeading: "Fit your Instagram bio into 150 characters",
    exampleHeading: "Instagram bio example",
  },
  "linkedin-post-character-counter": {
    inputLabel: "LinkedIn post",
    exampleAction: "Load LinkedIn example",
    copyAction: "Copy post",
    howToHeading: "Check a LinkedIn post before publishing",
    exampleHeading: "LinkedIn post example",
  },
  "youtube-title-character-counter": {
    inputLabel: "YouTube title",
    exampleAction: "Load title example",
    copyAction: "Copy title",
    howToHeading: "Keep your YouTube title within 100 characters",
    exampleHeading: "YouTube title example",
  },
  "youtube-description-character-counter": {
    inputLabel: "YouTube description",
    exampleAction: "Load description example",
    copyAction: "Copy description",
    howToHeading: "Check a YouTube description before uploading",
    exampleHeading: "YouTube description example",
  },
  "facebook-post-character-counter": {
    inputLabel: "Facebook post",
    exampleAction: "Load Facebook example",
    copyAction: "Copy post",
    howToHeading: "Check a Facebook post before publishing",
    exampleHeading: "Facebook post example",
  },
  "tiktok-caption-character-counter": {
    inputLabel: "TikTok caption",
    exampleAction: "Load TikTok example",
    copyAction: "Copy caption",
    howToHeading: "Check a TikTok caption before posting",
    exampleHeading: "TikTok caption example",
  },
  "social-media-character-counter": {
    inputLabel: "Caption or social post",
    exampleAction: "Load social post example",
    copyAction: "Copy text",
    howToHeading: "Check the length of any social post",
    exampleHeading: "Social post example",
  },
  "word-counter": {
    inputLabel: "Text to count",
    exampleAction: "Load writing example",
    copyAction: "Copy text",
    howToHeading: "Count words and characters as you write",
    exampleHeading: "Example text to count",
  },
  "hashtag-counter": {
    inputLabel: "Caption with hashtags",
    exampleAction: "Load hashtag example",
    copyAction: "Copy caption",
    howToHeading: "Count hashtags before you post",
    exampleHeading: "Caption with hashtags",
  },
  "line-break-generator": {
    inputLabel: "Caption with paragraph breaks",
    exampleAction: "Load spacing example",
    copyAction: "Copy formatted caption",
    outputLabel: "Caption with preserved spacing",
    howToHeading: "Keep blank lines when you paste a caption",
    exampleHeading: "Caption spacing example",
  },
  "bold-text-generator": {
    inputLabel: "Text to make bold",
    exampleAction: "Load bold text example",
    copyAction: "Copy bold text",
    outputLabel: "Bold text",
    howToHeading: "Create copyable bold text",
    exampleHeading: "Bold text example",
  },
  "italic-text-generator": {
    inputLabel: "Text to italicize",
    exampleAction: "Load italic text example",
    copyAction: "Copy italic text",
    outputLabel: "Italic text",
    howToHeading: "Create copyable italic text",
    exampleHeading: "Italic text example",
  },
};

export const textToolSlugs = textTools.map((tool) => tool.slug);

export const getTextTool = (slug: string): TextToolDefinition | undefined =>
  textTools.find((tool) => tool.slug === slug);

export const getTextToolUiCopy = (slug: string): TextToolUiCopy => {
  const copy = TEXT_TOOL_UI_COPY[slug];
  if (!copy) {
    throw new Error(`Missing task copy for text tool: ${slug}`);
  }
  return copy;
};

export const getTextToolMetadata = (slug: string) => {
  const tool = getTextTool(slug);
  if (!tool) {
    throw new Error(`Unknown text tool: ${slug}`);
  }
  return {
    title: tool.metadataTitle,
    description: tool.metaDescription,
    canonicalPath: `/tools/text-tools/${tool.slug}`,
    keywords: tool.keywords,
  };
};

export const analyzeText = (text: string): TextAnalysis => ({
  characters: Array.from(text).length,
  words: text.match(/[\p{L}\p{N}]+(?:['’_-][\p{L}\p{N}]+)*/gu)?.length ?? 0,
  hashtags: text.match(/(?:^|\s)#[\p{L}\p{N}_]+/gu)?.length ?? 0,
  mentions: text.match(/(?:^|\s)@[\p{L}\p{N}_]+/gu)?.length ?? 0,
  lines: text.length === 0 ? 0 : text.split(LINE_BREAK_PATTERN).length,
});

const transformAscii = (
  text: string,
  ranges: { upper: number; lower: number; digit?: number }
) =>
  Array.from(text, (character) => {
    const code = character.codePointAt(0) ?? 0;
    if (code >= 65 && code <= 90) {
      return String.fromCodePoint(ranges.upper + code - 65);
    }
    if (code >= 97 && code <= 122) {
      if (ranges.lower === 0x1_d4_4e && character === "h") {
        return "ℎ";
      }
      return String.fromCodePoint(ranges.lower + code - 97);
    }
    if (ranges.digit !== undefined && code >= 48 && code <= 57) {
      return String.fromCodePoint(ranges.digit + code - 48);
    }
    return character;
  }).join("");

export const transformText = (text: string, mode: TextToolMode): string => {
  if (mode === "line-break") {
    if (text.length === 0) {
      return "";
    }
    return text
      .replace(/\r\n|\r/g, "\n")
      .split("\n")
      .map((line) => (line.trim().length === 0 ? "⠀" : line))
      .join("\n");
  }
  if (mode === "bold") {
    return transformAscii(text, {
      upper: 0x1_d5_d4,
      lower: 0x1_d5_ee,
      digit: 0x1_d7_ec,
    });
  }
  if (mode === "italic") {
    return transformAscii(text, { upper: 0x1_d4_34, lower: 0x1_d4_4e });
  }
  return text;
};
