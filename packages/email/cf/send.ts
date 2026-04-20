export interface SendEmailBinding {
  send(message: {
    to: Array<{ email: string; name?: string }>;
    from: { email: string; name?: string };
    subject: string;
    text?: string;
    html?: string;
    replyTo?: { email: string; name?: string };
    headers?: Record<string, string>;
  }): Promise<void>;
}

export interface SendCfEmailArgs {
  binding: SendEmailBinding;
  from: { email: string; name?: string };
  to: Array<{ email: string; name?: string }>;
  subject: string;
  html: string;
  text: string;
  replyTo?: { email: string; name?: string };
}

export interface SendCfEmailResult {
  ok: boolean;
  error?: string;
}

/**
 * Wraps env.SEND_EMAIL.send() with structured logging and non-throwing semantics.
 * Failures are logged and returned as `{ok:false}` — callers in user-facing
 * mutation paths should never be blocked by a mail failure.
 */
export async function sendCfEmail(
  args: SendCfEmailArgs
): Promise<SendCfEmailResult> {
  try {
    await args.binding.send({
      to: args.to,
      from: args.from,
      subject: args.subject,
      text: args.text,
      html: args.html,
      replyTo: args.replyTo,
    });
    console.log(
      `[Email] sent subject="${args.subject}" to=${args.to.map((t) => t.email).join(",")}`
    );
    return { ok: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(
      `[Email] send failed subject="${args.subject}" to=${args.to.map((t) => t.email).join(",")} error=${error}`
    );
    return { ok: false, error };
  }
}
