import type {
  PostReturnType,
  SocialPublishInputType,
} from '@delulu/validators/post';
import type { Result } from 'neverthrow';

export type SocialProvider = {
  publish: (input: {
    content: SocialPublishInputType;
    socialProviderId: string;
  }) => Promise<Result<PostReturnType, Error>>;
  connectUrl: () => Promise<Result<string, Error>> | Result<string, Error>;
  //   connect: (input: ConnectInput) => Promise<ConnectResult>;
  //   reconnect: (input: ConnectInput) => Promise<ConnectResult>;
};
