import { createSocialPreviewMetadata } from "../utils/metadata";
import { SocialPreviewPage } from "../utils/social-preview-page";

const slug = "youtube-post-preview";

export const metadata = createSocialPreviewMetadata(slug);

export default function YouTubePostPreviewPage() {
  return <SocialPreviewPage slug={slug} />;
}
