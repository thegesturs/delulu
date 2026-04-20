import {
  postPublishFailed,
  postReviewRequested,
  sendCfEmail,
  welcome,
} from "@delulu/email/cf";
import type { Env } from "../types";

function appUrl(env: Env): string {
  return env.DELULU_APP_URL || "https://solulu.delulu.social";
}

export async function sendReviewRequestedEmail(
  env: Env,
  args: {
    recipients: Array<{ email: string; name?: string }>;
    submitterName: string;
    postPreview: string;
    postId: string;
  }
) {
  if (args.recipients.length === 0) {
    console.log(
      `[Email] review-requested postId=${args.postId} — no reviewer recipients, skipping`
    );
    return { ok: true as const };
  }
  const rendered = postReviewRequested({
    submitterName: args.submitterName,
    postPreview: args.postPreview,
    reviewUrl: `${appUrl(env)}/review/${args.postId}`,
  });
  return sendCfEmail({
    binding: env.SEND_EMAIL,
    from: {
      email: env.NOTIFICATION_FROM_EMAIL,
      name: env.NOTIFICATION_FROM_NAME,
    },
    to: args.recipients,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  });
}

export async function sendPublishFailedEmail(
  env: Env,
  args: {
    recipient: { email: string; name?: string };
    postPreview: string;
    failureReason: string;
    postId: string;
  }
) {
  const rendered = postPublishFailed({
    postPreview: args.postPreview,
    failureReason: args.failureReason,
    postUrl: `${appUrl(env)}/posts/${args.postId}`,
  });
  return sendCfEmail({
    binding: env.SEND_EMAIL,
    from: {
      email: env.NOTIFICATION_FROM_EMAIL,
      name: env.NOTIFICATION_FROM_NAME,
    },
    to: [args.recipient],
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  });
}

export async function sendWelcomeEmail(
  env: Env,
  args: { recipient: { email: string; name?: string }; name: string }
) {
  const rendered = welcome({ name: args.name, appUrl: appUrl(env) });
  return sendCfEmail({
    binding: env.SEND_EMAIL,
    from: {
      email: env.NOTIFICATION_FROM_EMAIL,
      name: env.NOTIFICATION_FROM_NAME,
    },
    to: [args.recipient],
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  });
}
