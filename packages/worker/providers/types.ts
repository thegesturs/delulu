import type {
  PostReturnType,
  SocialPublishInputType,
} from "@delulu/validators/post";
import type { Result } from "neverthrow";
import type { SocialProviderError } from "./errors";

export interface SocialProvider {
  publish: (input: {
    content: SocialPublishInputType;
    socialProviderId: string;
  }) => Promise<Result<PostReturnType, SocialProviderError>>;
  connectUrl?: () => string;
}
