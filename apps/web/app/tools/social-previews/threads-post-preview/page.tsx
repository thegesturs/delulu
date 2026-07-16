import { createSocialPreviewMetadata } from "../utils/metadata";
import { SocialPreviewPage } from "../utils/social-preview-page";

const slug = "threads-post-preview";

export const metadata = createSocialPreviewMetadata(slug);

export default function ThreadsPostPreviewPage() {
  return <SocialPreviewPage slug={slug} />;
}
