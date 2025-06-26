import { analytics } from '@delulu/analytics/posthog/server';
import { database, schema } from '@delulu/database';
import { resend } from '@delulu/email';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { keys } from './keys';

export const auth = betterAuth({
  database: drizzleAdapter(database, {
    provider: 'pg',
    schema: {
      users: schema.users,
      accounts: schema.accounts,
      sessions: schema.sessions,
      verifications: schema.verifications,
    },
    usePlural: true,
  }),
  emailVerification: {
    async sendVerificationEmail({ user, url }) {
      await resend.emails.send({
        from: 'Delulu Social <noreply@delulu.social>',
        to: user.email,
        subject: 'Verify Your Email Address',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333; text-align: center;">Welcome to Delulu Social!</h1>
              <p>Hello,</p>
              <p>Thank you for signing up for Delulu Social. To complete your account setup, please verify your email address by clicking the button below:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${url}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email Address</a>
              </div>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${url}</p>
              <p>This link will expire in 24 hours for security reasons.</p>
              <p>If you didn't create an account with Delulu Social, please ignore this email.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 12px;">This email was sent by Delulu Social. If you have any questions, please contact our support team.</p>
            </div>
          `,
      });
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: 'Delulu Social <noreply@delulu.social>',
        to: user.email,
        subject: 'Reset Your Password',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333; text-align: center;">Reset Your Password</h1>
              <p>Hello,</p>
              <p>You requested to reset your password for your Delulu Social account. Click the button below to reset your password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${url}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
              </div>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${url}</p>
              <p>This link will expire in 24 hours for security reasons.</p>
              <p>If you didn't request this password reset, please ignore this email.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 12px;">This email was sent by Delulu Social. If you have any questions, please contact our support team.</p>
            </div>
          `,
      });
    },
  },
  socialProviders: {
    google: {
      clientId: keys().GOOGLE_CLIENT_ID,
      clientSecret: keys().GOOGLE_CLIENT_SECRET,
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['google'],
      updateUserInfoOnLink: true,
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await analytics.identify({
            distinctId: user.id,
            properties: {
              email: user.email,
              firstName: user.name?.split(' ')[0],
              lastName: user.name?.split(' ')[1],
              createdAt: user.createdAt,
              avatar: user.image,
            },
          });
        },
      },
      update: {
        after: async (user) => {
          await analytics.identify({
            distinctId: user.id,
            properties: {
              email: user.email,
              firstName: user.name?.split(' ')[0],
              lastName: user.name?.split(' ')[1],
              createdAt: user.createdAt,
              avatar: user.image,
            },
          });
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
export { toNextJsHandler } from 'better-auth/next-js';
export { getSessionCookie } from 'better-auth/cookies';
