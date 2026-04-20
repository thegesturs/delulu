import { button, escapeHtml, toPlainText, wrapLayout } from "../layout";

export interface WelcomeProps {
  name: string;
  appUrl: string;
}

export function welcome(props: WelcomeProps): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = props.name.split(" ")[0] || props.name;
  const subject = "Welcome to Delulu";
  const body = `
<p style="margin:0 0 16px 0;font-size:18px;font-weight:600;">Hey ${escapeHtml(firstName)} 👋</p>
<p style="margin:0 0 16px 0;">Welcome to Delulu. You're set up and ready to schedule, post, and automate across your social accounts.</p>
<p style="margin:0 0 8px 0;font-weight:600;">A few good next moves:</p>
<ul style="margin:0 0 16px 20px;padding:0;">
<li style="margin:0 0 6px 0;">Connect your first social account.</li>
<li style="margin:0 0 6px 0;">Draft a post and schedule it.</li>
<li style="margin:0 0 6px 0;">Set up an Instagram auto-DM automation.</li>
</ul>
${button(props.appUrl, "Open Delulu")}
<p style="margin:24px 0 0 0;font-size:13px;color:#71717a;">Reply to this email if you hit anything weird — a real human reads it.</p>
`;
  const html = wrapLayout({
    title: subject,
    preheader: "Welcome to Delulu — let's get you posting.",
    bodyHtml: body,
  });
  return { subject, html, text: toPlainText(html) };
}
