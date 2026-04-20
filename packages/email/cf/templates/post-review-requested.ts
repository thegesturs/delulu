import { button, escapeHtml, toPlainText, wrapLayout } from "../layout";

export interface PostReviewRequestedProps {
  submitterName: string;
  postPreview: string;
  reviewUrl: string;
}

export function postReviewRequested(props: PostReviewRequestedProps): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `${props.submitterName} submitted a post for review`;
  const preview = props.postPreview.slice(0, 200);
  const body = `
<p style="margin:0 0 16px 0;font-size:16px;font-weight:600;">New post awaiting review</p>
<p style="margin:0 0 16px 0;">${escapeHtml(props.submitterName)} submitted a post for your approval.</p>
<div style="background:#f4f4f5;border-radius:8px;padding:16px;margin:16px 0;font-size:14px;color:#3f3f46;">
${escapeHtml(preview) || '<em style="color:#71717a;">(no text content)</em>'}
</div>
${button(props.reviewUrl, "Review post")}
<p style="margin:24px 0 0 0;font-size:13px;color:#71717a;">Or open this link: <a href="${escapeHtml(props.reviewUrl)}" style="color:#3f3f46;">${escapeHtml(props.reviewUrl)}</a></p>
`;
  const html = wrapLayout({
    title: subject,
    preheader: `${props.submitterName} submitted a post for review`,
    bodyHtml: body,
  });
  return { subject, html, text: toPlainText(html) };
}
