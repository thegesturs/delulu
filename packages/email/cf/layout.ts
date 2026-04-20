export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function wrapLayout(opts: {
  preheader?: string;
  title: string;
  bodyHtml: string;
}): string {
  const preheader = opts.preheader ? escapeHtml(opts.preheader) : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#18181b;">
<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#fafafa;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" width="560" style="max-width:560px;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;">
<tr><td style="padding:24px 32px;border-bottom:1px solid #f4f4f5;">
<span style="font-size:18px;font-weight:600;color:#18181b;">Delulu</span>
</td></tr>
<tr><td style="padding:32px;line-height:1.55;font-size:15px;color:#27272a;">
${opts.bodyHtml}
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #f4f4f5;font-size:12px;color:#a1a1aa;">
You're receiving this because you use Delulu.&nbsp;&middot;&nbsp;
<a href="https://delulu.social" style="color:#a1a1aa;text-decoration:underline;">delulu.social</a>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function toPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;"><tr><td>
<a href="${escapeHtml(href)}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;font-weight:500;padding:10px 18px;border-radius:8px;font-size:14px;">${escapeHtml(label)}</a>
</td></tr></table>`;
}
