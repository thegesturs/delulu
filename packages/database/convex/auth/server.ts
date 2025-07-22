'use node';

import { convexAdapter } from '@convex-dev/better-auth';
import { convex } from '@convex-dev/better-auth/plugins';
// import { analytics } from '@delulu/analytics/posthog/server';
import type { ActionCtx } from '@delulu/database/convex/_generated/server';
import { betterAuthComponent } from '@delulu/database/convex/auth';
import { betterAuth } from 'better-auth';
import { sendEmailVerification, sendResetPassword } from '../emails';

export const createAuth = (ctx: ActionCtx) =>
  betterAuth({
    database: convexAdapter(ctx, betterAuthComponent),
    baseURL: process.env.NEXT_PUBLIC_APP_URL,
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        await sendEmailVerification(ctx, {
          to: user.email,
          url,
        });
      },
    },
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      sendResetPassword: async ({ user, url }) => {
        await sendResetPassword(ctx, {
          to: user.email,
          url,
        });
      },
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ['google'],
        updateUserInfoOnLink: true,
      },
    },
    advanced: {
      crossSubDomainCookies: {
        enabled: true,
        domain: '.delulu.social',
      },
    },
    trustedOrigins: ['https://delulu.social', 'https://solulu.delulu.social'],

    // databaseHooks: {
    //   user: {
    //     create: {
    //       // biome-ignore lint/suspicious/useAwait: <explanation>
    //       after: async (user) => {
    //         analytics.identify({
    //           distinctId: user.id,
    //           properties: {
    //             email: user.email,
    //             firstName: user.name?.split(' ')[0],
    //             lastName: user.name?.split(' ')[1],
    //             createdAt: user.createdAt,
    //             avatar: user.image,
    //           },
    //         });
    //       },
    //     },
    //     update: {
    //       // biome-ignore lint/suspicious/useAwait: <explanation>
    //       after: async (user) => {
    //         analytics.identify({
    //           distinctId: user.id,
    //           properties: {
    //             email: user.email,
    //             firstName: user.name?.split(' ')[0],
    //             lastName: user.name?.split(' ')[1],
    //             createdAt: user.createdAt,
    //             avatar: user.image,
    //           },
    //         });
    //       },
    //     },
    //   },
    // },
    plugins: [convex()],
  });

export type Session = ReturnType<typeof createAuth>['$Infer']['Session'];
export type User = ReturnType<typeof createAuth>['$Infer']['Session']['user'];
export { toNextJsHandler } from 'better-auth/next-js';
export { getSessionCookie } from 'better-auth/cookies';
