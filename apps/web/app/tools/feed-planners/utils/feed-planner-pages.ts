export type FeedPlannerVariant = "grid" | "feed";

export interface FeedPlannerPageDefinition {
  slug: string;
  title: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  variant: FeedPlannerVariant;
  intro: string[];
  howToHeading: string;
  howToSteps: Array<{ name: string; text: string }>;
  sections: Array<{ heading: string; paragraphs: string[] }>;
  faq: Array<{ question: string; answer: string }>;
  relatedSlugs: string[];
  relatedHeading: string;
}

export const feedPlannerPages: FeedPlannerPageDefinition[] = [
  {
    slug: "instagram-feed-planner",
    title: "Free Instagram Feed Planner",
    description:
      "Add photos and videos, then arrange them in a three-column profile grid before you post. Free, private, and no signup required.",
    metaTitle: "Instagram Feed Planner – Preview Your Grid Free",
    metaDescription:
      "Plan your Instagram feed in a free 3-column grid. Add, reorder, select, and preview photos or videos privately in your browser with no signup.",
    keywords: [
      "instagram feed planner",
      "instagram grid planner",
      "preview instagram feed",
      "free instagram planner",
      "visual instagram planner",
    ],
    variant: "grid",
    intro: [
      "See how your next posts work together before anything goes live. This free Instagram feed planner turns local photos and videos into a familiar three-column profile grid, so you can test color balance, pacing, and campaign sequences in seconds.",
      "Your files stay on your device. Reorder them by dragging or with the arrow controls, select the posts you want to work on next, and send their plan to the Delulu composer when the sequence feels right.",
    ],
    howToHeading: "How to plan an Instagram feed",
    howToSteps: [
      {
        name: "Add your media",
        text: "Choose photos or videos from your device, drop them into the grid, or try the sample posts first.",
      },
      {
        name: "Arrange the 3-column grid",
        text: "Drag tiles into position or use the arrow buttons for precise, keyboard-friendly reordering.",
      },
      {
        name: "Choose what to create next",
        text: "Select one or more tiles and open the ordered content plan in the Delulu post composer.",
      },
    ],
    sections: [
      {
        heading: "Plan a grid with purpose",
        paragraphs: [
          "A strong profile grid does not require every tile to match. Use the preview to distribute bright and dark images, alternate product and people shots, or check that a multi-post launch reads in the right order.",
          "Try adding the next nine posts at once. That gives you three complete rows and makes repeated colors, near-duplicate crops, and awkward transitions much easier to spot.",
        ],
      },
      {
        heading: "Private, local media previews",
        paragraphs: [
          "Photos and videos stay on your device while you arrange them. Choose Remove all to clear every preview from the page.",
        ],
      },
    ],
    faq: [
      {
        question: "Is this Instagram feed planner free?",
        answer:
          "Yes. You can add, rearrange, preview, and clear media without an account or a paid plan.",
      },
      {
        question: "Does the planner upload my photos or videos?",
        answer:
          "No. Files you add are previewed locally with temporary browser URLs and are not sent to Delulu's servers.",
      },
      {
        question: "Why does the preview use a 3-column grid?",
        answer:
          "The three-column layout mirrors the familiar profile view, which makes rows, diagonals, color patterns, and launch sequences easier to evaluate.",
      },
      {
        question: "Can I rearrange posts without dragging?",
        answer:
          "Yes. Every tile has previous and next controls, so you can change the order with a mouse, keyboard, or touch-friendly buttons.",
      },
      {
        question: "Can I preview videos in the grid?",
        answer:
          "Yes. Local video files appear as muted playable previews alongside images, making mixed-media planning possible.",
      },
      {
        question: "What happens when I select tiles?",
        answer:
          "Selected posts are included when you continue to Delulu. If you do not select anything, the full grid order is included.",
      },
      {
        question: "Will this publish or schedule my posts automatically?",
        answer:
          "No. Nothing publishes from this page. Delulu opens a new draft where you can add the original media, write captions, choose accounts, and decide when to publish.",
      },
    ],
    relatedSlugs: ["social-media-feed-planner"],
    relatedHeading: "Prefer to review posts one at a time?",
  },
  {
    slug: "social-media-feed-planner",
    title: "Free Social Media Feed Planner",
    description:
      "Add photos and videos, then arrange them in the order people will scroll through them. Free, private, and no signup required.",
    metaTitle: "Social Media Feed Planner – Preview Posts Free",
    metaDescription:
      "Preview a social media content plan as a vertical feed. Add, reorder, select, and review local photos or videos privately with no signup required.",
    keywords: [
      "social media feed planner",
      "content feed planner",
      "social media post planner",
      "visual content planner free",
      "preview social media posts",
    ],
    variant: "feed",
    intro: [
      "A grid is useful for profile aesthetics, but most people experience content one post at a time. This free social media feed planner shows local photos and videos in a vertical sequence so you can review pacing, format variety, and the opening visual of each planned post.",
      "Add campaign photos and videos, reorder them until the story flows, and select the posts you want to create next. Your media stays on your device; Delulu opens with the order you chose so you can add the originals there.",
    ],
    howToHeading: "How to build a visual social media feed plan",
    howToSteps: [
      {
        name: "Collect campaign media",
        text: "Add the photos and videos you are considering, or try the sample posts to see how the scrolling view works.",
      },
      {
        name: "Review the scroll order",
        text: "Move each post earlier or later and scan the vertical feed for repetitive formats, weak openings, or abrupt visual changes.",
      },
      {
        name: "Continue in the composer",
        text: "Select the assets for your next batch and open their ordered plan in Delulu before adding the original files and captions.",
      },
    ],
    sections: [
      {
        heading: "Balance a mixed-format content plan",
        paragraphs: [
          "The vertical preview is useful when a campaign mixes portraits, product images, explainers, and video. Look for long runs of one format and move a contrasting post earlier when the feed starts to feel repetitive.",
          "You can also use the order as a simple narrative: introduce the idea, show the result, explain the process, and finish with proof or a clear next step.",
        ],
      },
      {
        heading: "No account and no media upload",
        paragraphs: [
          "Your photos and videos stay on your device. They disappear from the page when you choose Remove all or close the tab.",
        ],
      },
    ],
    faq: [
      {
        question: "Is the social media feed planner free to use?",
        answer:
          "Yes. You can arrange as many post sequences as you need without signing up or adding a watermark.",
      },
      {
        question: "How is the vertical feed different from the grid planner?",
        answer:
          "The vertical feed emphasizes one-post-at-a-time pacing and mixed formats, while the grid planner emphasizes the visual relationship between three-column profile tiles.",
      },
      {
        question: "Are local media files sent to a server?",
        answer:
          "No. Images and videos stay on your device. When you continue to Delulu, the new draft contains the order you selected, not the media itself.",
      },
      {
        question: "Can I plan both images and videos?",
        answer:
          "Yes. Add common image and video files together, then reorder them in one visual sequence.",
      },
      {
        question: "Can I use the planner on a phone or tablet?",
        answer:
          "Yes. The layout is responsive, and the previous and next buttons provide an alternative to drag-and-drop on touch devices.",
      },
      {
        question: "What does selecting a post do?",
        answer:
          "It includes that post when you continue to Delulu. Select your next batch, or leave everything unselected to include the full order.",
      },
      {
        question: "Does opening Delulu publish anything?",
        answer:
          "No. It opens a new draft with the ordered plan. You stay in control of adding media, editing copy, choosing destinations, and scheduling or publishing.",
      },
    ],
    relatedSlugs: ["instagram-feed-planner"],
    relatedHeading: "Want to check your three-column grid?",
  },
];

export const getFeedPlannerPage = (slug: string): FeedPlannerPageDefinition => {
  const page = feedPlannerPages.find((candidate) => candidate.slug === slug);
  if (!page) {
    throw new Error(`Unknown feed planner page: ${slug}`);
  }
  return page;
};
