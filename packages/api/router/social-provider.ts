import { SocialTypeSchema, savePostInputSchema } from '@delulu/validators/post';
import type { TRPCRouterRecord } from '@trpc/server';
import { providerRegistry } from '../providers';
import { protectedProcedure } from '../trpc';
import { z } from 'zod';

export const socialProviderRouter = {
  getSocialProviderConnectUrl: protectedProcedure
    .input(
      z.object({
        provider: SocialTypeSchema.extract(['LINKEDIN', 'TWITTER']),
      })
    )
    .mutation(({ input }) => {
      return providerRegistry[input.provider].connectUrl();
    }),

  getConnectedAccounts: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.socialProvider.findMany({
      where: {
        userId: ctx.userId,
      },
    });
  }),
  createPost: protectedProcedure
    .input(savePostInputSchema)
    .mutation(async ({ input }) => {
      const results = [];

      for (const provider of input.socialProviders) {
        // Skip providers that are not implemented
        if (
          provider.socialType !== 'TWITTER' &&
          provider.socialType !== 'LINKEDIN'
        ) {
          continue;
        }

        // Find alternative content for this provider if it exists
        const alternativeContent = input.alternativeContent.find(
          (alt) => alt.socialProvider.socialId === provider.socialId
        );

        // Use alternative content if available, otherwise use default content
        const contentToPost = alternativeContent?.content ?? input.content;

        // Get the provider implementation
        const providerImpl = providerRegistry[provider.socialType];

        // Post the content using the provider's implementation
        const result = await providerImpl.publish({
          content: {
            ...input,
            content: contentToPost,
          },
          socialProviderId: provider.socialId,
        });

        results.push(result);
      }

      return results;
    }),
} satisfies TRPCRouterRecord;
