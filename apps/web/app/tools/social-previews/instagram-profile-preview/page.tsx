import { createSocialPreviewMetadata } from "../utils/metadata";
import { SocialPreviewPage } from "../utils/social-preview-page";

const slug = "instagram-profile-preview";

export const metadata = createSocialPreviewMetadata(slug);

export default function InstagramProfilePreviewPage() {
  return <SocialPreviewPage slug={slug} />;
}
