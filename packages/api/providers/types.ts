import type {
  PostReturnType,
  SocialPublishInputType,
} from '@delulu/validators/post';

export type SocialProvider = {
  publish: (input: {
    content: SocialPublishInputType;
    socialProviderId: string;
  }) => Promise<PostReturnType>;
  connectUrl: () => Promise<string> | string;
  //   connect: (input: ConnectInput) => Promise<ConnectResult>;
  //   reconnect: (input: ConnectInput) => Promise<ConnectResult>;
};
