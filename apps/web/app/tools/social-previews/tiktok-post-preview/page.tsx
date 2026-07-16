import { createSocialPreviewMetadata } from "../utils/metadata";
import { SocialPreviewPage } from "../utils/social-preview-page";

const slug = "tiktok-post-preview";

export const metadata = createSocialPreviewMetadata(slug);

export default function TikTokPostPreviewPage() {
  return <SocialPreviewPage slug={slug} />;
}
