import { button, escapeHtml, toPlainText, wrapLayout } from "../layout";

export interface PostPublishFailedProps {
  postPreview: string;
  failureReason: string;
  postUrl: string;
}

export function postPublishFailed(props: PostPublishFailedProps): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Your scheduled post failed to publish";
  const preview = props.postPreview.slice(0, 200);
  const body = `
<p style="margin:0 0 16px 0;font-size:16px;font-weight:600;">Your post didn't go out</p>
<p style="margin:0 0 16px 0;">One of your scheduled posts hit an error while publishing. The draft is safe — you can retry from the app.</p>
<div style="background:#f4f4f5;border-radius:8px;padding:16px;margin:16px 0;font-size:14px;color:#3f3f46;">
${escapeHtml(preview) || '<em style="color:#71717a;">(no text content)</em>'}
</div>
<p style="margin:16px 0 8px 0;font-size:13px;color:#71717a;">Reason:</p>
<div style="background:#fef2f2;border-left:3px solid #f87171;border-radius:4px;padding:12px 14px;margin:0 0 16px 0;font-size:13px;color:#991b1b;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">
${escapeHtml(props.failureReason)}
</div>
${button(props.postUrl, "Open post")}
`;
  const html = wrapLayout({
    title: subject,
    preheader: "Your scheduled post failed to publish",
    bodyHtml: body,
  });
  return { subject, html, text: toPlainText(html) };
}
