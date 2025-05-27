import type { FullPostType, PostReturnType } from '@delulu/validators/post';

export type SocialProvider = {
  publish: (input: {
    content: FullPostType;
    socialProviderId: string;
  }) => Promise<PostReturnType>;
  connectUrl: () => Promise<string> | string;
  //   connect: (input: ConnectInput) => Promise<ConnectResult>;
  //   reconnect: (input: ConnectInput) => Promise<ConnectResult>;
};
