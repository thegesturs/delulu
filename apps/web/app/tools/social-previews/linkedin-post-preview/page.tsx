import { createSocialPreviewMetadata } from "../utils/metadata";
import { SocialPreviewPage } from "../utils/social-preview-page";

const slug = "linkedin-post-preview";

export const metadata = createSocialPreviewMetadata(slug);

export default function LinkedInPostPreviewPage() {
  return <SocialPreviewPage slug={slug} />;
}
