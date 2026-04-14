"use client";

import type { SupportedSocialPlatform } from "@delulu/design-system/lib/social-config";
import { FacebookPreview } from "@/components/post/sidebar/previews/facebook-preview";
import { InstagramPreview } from "@/components/post/sidebar/previews/instagram-preview";
import { LinkedInPreview } from "@/components/post/sidebar/previews/linkedin-preview";
import { ThreadsPreview } from "@/components/post/sidebar/previews/threads-preview";
import { TikTokPreview } from "@/components/post/sidebar/previews/tiktok-preview";
import { TwitterPreview } from "@/components/post/sidebar/previews/twitter-preview";
import { YouTubePreview } from "@/components/post/sidebar/previews/youtube-preview";

interface PostData {
  content: Array<{
    text: string;
    media: Array<{
      url?: string;
      bucketKey?: string;
      mediaType: "IMAGE" | "VIDEO" | "DOCUMENT";
      altText?: string;
    }>;
  }>;
  socialProviders?: Array<{
    _id: string;
    socialType: string;
    username?: string;
    fullName?: string;
    profileImage?: string;
  }>;
}

interface ReviewPlatformPreviewProps {
  socialType: SupportedSocialPlatform;
  postData: PostData;
}

export function ReviewPlatformPreview({
  socialType,
  postData,
}: ReviewPlatformPreviewProps) {
  switch (socialType) {
    case "TIKTOK":
      return <TikTokPreview postData={postData} />;
    case "INSTAGRAM":
      return <InstagramPreview postData={postData} />;
    case "TWITTER":
      return <TwitterPreview postData={postData} />;
    case "LINKEDIN":
      return <LinkedInPreview postData={postData} />;
    case "FACEBOOK":
      return <FacebookPreview postData={postData} />;
    case "YOUTUBE":
      return <YouTubePreview postData={postData} />;
    case "THREADS":
      return <ThreadsPreview postData={postData} />;
    default:
      return (
        <div className="flex items-center justify-center p-6 text-muted-foreground text-sm">
          Preview not available for {socialType}
        </div>
      );
  }
}
