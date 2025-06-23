import 'server-only';

import { PrismaClient } from '@delulu/database';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nanoid } from 'nanoid';
import { Resend } from 'resend';
import { keys } from './keys';

const prisma = new PrismaClient();

const resend = new Resend(keys().RESEND_API_KEY);

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailVerification: {
    async sendVerificationEmail({ user, url, token }) {
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
  account: {
    accountLinking: {
      trustedProviders: ['google'],
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: true,
    sendResetPassword: async ({ user, url, token }) => {
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
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  changeEmail: {
    enabled: true,
    requireEmailVerification: true,
  },
  changePassword: {
    enabled: true,
  },
  advanced: {
    generateId: () => nanoid(),
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
export { toNextJsHandler } from 'better-auth/next-js';
export { getSessionCookie } from 'better-auth/cookies';
