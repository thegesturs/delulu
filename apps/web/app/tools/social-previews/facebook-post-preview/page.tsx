import { createSocialPreviewMetadata } from "../utils/metadata";
import { SocialPreviewPage } from "../utils/social-preview-page";

const slug = "facebook-post-preview";

export const metadata = createSocialPreviewMetadata(slug);

export default function FacebookPostPreviewPage() {
  return <SocialPreviewPage slug={slug} />;
}
