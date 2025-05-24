import { Prisma } from '@prisma/client';
import { nanoid } from 'nanoid';

const PREFIX_MAP = {
  Post: 'post_',
  OrganizationInvites: 'orginv_',
  OrganizationMember: 'orgmbr_',
  PlatformPost: 'platform_',
  YoutubeToken: 'yt_',
  YoutubeContent: 'ytc_',
  SocialProvider: 'social_',
} as const;

type PrefixedModels = keyof typeof PREFIX_MAP;

type ModelArgs = {
  args: {
    data: Record<string, unknown>;
    [key: string]: unknown;
  };
  model: string;
};

type ModelManyArgs = {
  args: {
    data: Record<string, unknown>[];
    [key: string]: unknown;
  };
  model: string;
};

// Create a Prisma Client extension for ID generation
export const prefixedIdExtension = Prisma.defineExtension({
  name: 'prefixedIdExtension',
  model: {
    $allModels: {
      beforeCreate<T extends PrefixedModels>({ args, model }: ModelArgs) {
        const prefix = PREFIX_MAP[model as T];
        if (prefix) {
          return {
            args: {
              ...args,
              data: {
                ...args.data,
                id: `${prefix}${nanoid(12)}`,
              },
            },
          };
        }
        return { args };
      },
      async beforeCreateMany<T extends PrefixedModels>({
        args,
        model,
      }: ModelManyArgs) {
        const prefix = PREFIX_MAP[model as T];
        if (prefix && Array.isArray(args.data)) {
          return {
            args: {
              ...args,
              data: args.data.map((item: Record<string, unknown>) => ({
                ...item,
                id: `${prefix}${nanoid(12)}`,
              })),
            },
          };
        }
        return { args };
      },
    },
  },
});
