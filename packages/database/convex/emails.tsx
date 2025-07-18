import './polyfills';
import { Resend } from '@convex-dev/resend';
import {
  MagicLinkEmail,
  ResetPasswordEmail,
  VerifyEmail,
  VerifyOTP,
} from '@delulu/email';
import { render } from '@react-email/components';
import { components } from './_generated/api';
import type { ActionCtx } from './_generated/server';

export const resend: Resend = new Resend(components.resend, {
  testMode: false,
});

export const sendEmailVerification = async (
  ctx: ActionCtx,
  {
    to,
    url,
  }: {
    to: string;
    url: string;
  }
) => {
  await resend.sendEmail(ctx, {
    from: 'Delulu Social <noreply@delulu.social>',
    to,
    subject: 'Verify your email address',
    html: await render(<VerifyEmail url={url} />),
  });
};

export const sendOTPVerification = async (
  ctx: ActionCtx,
  {
    to,
    code,
  }: {
    to: string;
    code: string;
  }
) => {
  await resend.sendEmail(ctx, {
    from: 'Delulu Social <noreply@delulu.social>',
    to,
    subject: 'Your verification code',
    html: await render(<VerifyOTP code={code} />),
  });
};

export const sendMagicLink = async (
  ctx: ActionCtx,
  {
    to,
    url,
  }: {
    to: string;
    url: string;
  }
) => {
  await resend.sendEmail(ctx, {
    from: 'Delulu Social <noreply@delulu.social>',
    to,
    subject: 'Sign in to your account',
    html: await render(<MagicLinkEmail url={url} />),
  });
};

export const sendResetPassword = async (
  ctx: ActionCtx,
  {
    to,
    url,
  }: {
    to: string;
    url: string;
  }
) => {
  await resend.sendEmail(ctx, {
    from: 'Delulu Social <noreply@delulu.social>',
    to,
    subject: 'Reset your password',
    html: await render(<ResetPasswordEmail url={url} />),
  });
};
