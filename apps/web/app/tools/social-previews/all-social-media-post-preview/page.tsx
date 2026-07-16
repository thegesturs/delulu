import { createSocialPreviewMetadata } from "../utils/metadata";
import { SocialPreviewPage } from "../utils/social-preview-page";

const slug = "all-social-media-post-preview";

export const metadata = createSocialPreviewMetadata(slug);

export default function AllSocialMediaPostPreviewPage() {
  return <SocialPreviewPage slug={slug} />;
}
