import { createSocialPreviewMetadata } from "../utils/metadata";
import { SocialPreviewPage } from "../utils/social-preview-page";

const slug = "instagram-post-preview";

export const metadata = createSocialPreviewMetadata(slug);

export default function InstagramPostPreviewPage() {
  return <SocialPreviewPage slug={slug} />;
}
