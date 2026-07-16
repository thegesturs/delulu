import type { SocialPreviewExample } from "./social-preview-tools";

export interface PreviewState {
  displayName: string;
  username: string;
  headline: string;
  text: string;
  altText: string;
  date: string;
  likes: number;
  comments: number;
  shares: number;
  posts: number;
  followers: number;
  following: number;
  avatarUrl: string;
  mediaUrls: string[];
}

export const EMPTY_STATE: PreviewState = {
  displayName: "",
  username: "",
  headline: "",
  text: "",
  altText: "",
  date: "2026-07-16",
  likes: 0,
  comments: 0,
  shares: 0,
  posts: 0,
  followers: 0,
  following: 0,
  avatarUrl: "",
  mediaUrls: [],
};

export function createExampleState(
  example: SocialPreviewExample
): PreviewState {
  return {
    ...EMPTY_STATE,
    displayName: example.displayName,
    username: example.username,
    headline: example.headline,
    text: example.text,
    altText: "A colorful creator workspace illustration",
    likes: 1284,
    comments: 48,
    shares: 17,
    posts: 142,
    followers: 18_600,
    following: 614,
    avatarUrl: "/images/logo.png",
    mediaUrls: ["/images/delulu/socials.png"],
  };
}

export function formatPreviewCount(value: number): string {
  return new Intl.NumberFormat("en", { notation: "compact" }).format(
    Math.max(0, value || 0)
  );
}

export function formatPreviewDate(value: string): string {
  if (!value) {
    return "Today";
  }
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}
