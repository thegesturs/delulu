import { DurableObject, WorkerEntrypoint } from "cloudflare:workers";
import { telegramCall } from "@delulu/communication-telegram";
import {
  ChannelConversation,
  type DeliveryResult,
  type MessageRecord,
} from "./channel-conversation";
import type { Env } from "./env";

const USER_ID_PATTERN = /^[1-9]\d{0,15}$/;

export const telegramConversationName = (token: string, sender: string) =>
  `telegram:${token.split(":")[0]}:${sender}`;

export class TelegramConversation extends ChannelConversation {
  protected async showProcessing(record: MessageRecord): Promise<number> {
    const previous = await this.ctx.storage.get<{
      messageId: string;
      typingAt: number;
      draftAt: number;
    }>("telegram-progress");
    const progress =
      previous?.messageId === record.id
        ? previous
        : {
            messageId: record.id,
            typingAt: 0,
            draftAt: 0,
          };
    const refresh = async (
      method: "sendChatAction" | "sendMessageDraft",
      field: "typingAt" | "draftAt",
      interval: number,
      body: Record<string, unknown>
    ) => {
      if (progress[field] > Date.now()) {
        return;
      }
      const result = await telegramCall<boolean>(
        this.env.TELEGRAM_BOT_TOKEN!,
        method,
        body,
        1500
      );
      progress[field] =
        Date.now() +
        (result.ok ? interval : Math.max(30_000, result.retryAfterMs ?? 0));
    };
    await Promise.all([
      refresh("sendChatAction", "typingAt", 4000, {
        chat_id: record.sender,
        action: "typing",
      }),
      refresh("sendMessageDraft", "draftAt", 20_000, {
        chat_id: record.sender,
        // The Telegram update ID is stable across retries; zero is not a valid draft ID.
        draft_id: Number(record.id) || 1,
        text: "",
      }),
    ]);
    await this.ctx.storage.put("telegram-progress", progress);
    return Math.max(
      1000,
      Math.min(
        30_000,
        Math.min(progress.typingAt, progress.draftAt) - Date.now()
      )
    );
  }
  protected enabled() {
    return this.env.TELEGRAM_INGRESS_ENABLED === "true";
  }
  protected authorized(sender: string) {
    return USER_ID_PATTERN.test(sender);
  }
  protected email(sender: string) {
    return `tg-${this.env.TELEGRAM_BOT_TOKEN!.split(":")[0]}-${sender}@guest.invalid`;
  }
  protected name(sender: string) {
    return telegramConversationName(this.env.TELEGRAM_BOT_TOKEN!, sender);
  }
  protected target() {
    return "TelegramResponseTarget";
  }
  protected async send(record: MessageRecord): Promise<DeliveryResult> {
    const result = await telegramCall<{ message_id: number }>(
      this.env.TELEGRAM_BOT_TOKEN!,
      "sendMessage",
      { chat_id: record.sender, text: record.response }
    );
    if (result.ok && Number.isSafeInteger(result.result?.message_id)) {
      return {
        ok: true,
        value: { messageKey: String(result.result.message_id) },
      };
    }
    const status = result.ok ? 0 : result.status;
    return {
      ok: false,
      error: {
        status,
        reason: "telegram_send_failed",
        retryable: status === 429,
        retryAfterMs: result.ok ? undefined : result.retryAfterMs,
        deliveryState: status >= 400 && status < 500 ? "not_sent" : "unknown",
      },
    };
  }
}

export class TelegramResponseTarget extends WorkerEntrypoint<
  Env,
  { conversation: string; messageId: string }
> {
  async onGadgetResponse(response: { text: string }) {
    if (!this.env.TELEGRAM_CONVERSATIONS) {
      throw new Error("Telegram storage unavailable");
    }
    await this.env.TELEGRAM_CONVERSATIONS.getByName(
      this.ctx.props.conversation
    ).complete(this.ctx.props.messageId, response.text);
  }
}

/** Bot-wide pilot cap, not a per-sender allowance that can be bypassed with accounts. */
export class TelegramAdmission extends DurableObject<Env> {
  async reserve(id: string, sender: string): Promise<boolean> {
    return this.ctx.storage.transaction(async (storage) => {
      const key = `receipt:${id}`;
      const previous = await storage.get<string>(key);
      if (previous) {
        return previous === sender;
      }
      const count = (await storage.get<number>("reserved")) ?? 0;
      if (count >= 10) {
        return false;
      }
      await storage.put(key, sender);
      await storage.put("reserved", count + 1);
      return true;
    });
  }
}
