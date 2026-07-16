import { createSocialPreviewMetadata } from "../utils/metadata";
import { SocialPreviewPage } from "../utils/social-preview-page";

const slug = "x-post-preview";

export const metadata = createSocialPreviewMetadata(slug);

export default function XPostPreviewPage() {
  return <SocialPreviewPage slug={slug} />;
}
