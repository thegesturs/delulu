import { afterEach, expect, it, vi } from "vitest";
import type { Env } from "./env";

vi.mock("cloudflare:workers", () => {
  class Worker {
    ctx: unknown;
    env: unknown;
    constructor(ctx: unknown, env: unknown) {
      this.ctx = ctx;
      this.env = env;
    }
  }
  return { DurableObject: Worker, WorkerEntrypoint: Worker };
});

import { WhatsAppConversation } from "./whatsapp-conversation";

class Storage {
  values = new Map<string, unknown>();
  alarm?: number;
  private queue = Promise.resolve();
  async get<T>(key: string): Promise<T | undefined> {
    return structuredClone(this.values.get(key)) as T | undefined;
  }
  async put(key: string, value: unknown) {
    this.values.set(key, structuredClone(value));
  }
  async list<T>({ prefix }: { prefix: string }): Promise<Map<string, T>> {
    return new Map(
      [...this.values].filter(([key]) => key.startsWith(prefix))
    ) as Map<string, T>;
  }
  async setAlarm(time: number) {
    this.alarm = time;
  }
  async deleteAlarm() {
    this.alarm = undefined;
  }
  transaction<T>(fn: (storage: Storage) => Promise<T>): Promise<T> {
    const run = this.queue.then(() => fn(this));
    this.queue = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }
}

const message = { id: "message-1", sender: "15550000001", text: "Hello" };

function harness(storage = new Storage()) {
  const jobs: Promise<unknown>[] = [];
  let actor: WhatsAppConversation;
  const submit = vi.fn(
    async (input: {
      chatGatewayRpcTarget: {
        onGadgetResponse(response: { text: string }): Promise<void>;
      };
    }) => {
      await input.chatGatewayRpcTarget.onGadgetResponse({ text: "Hello back" });
      return { accepted: true as const, chatPath: "/test" };
    }
  );
  const env = {
    WHATSAPP_INGRESS_ENABLED: "true",
    WHATSAPP_TEST_SENDER: message.sender,
    WHATSAPP_TEST_EMAIL: "tester@example.com",
    WHATSAPP_PHONE_NUMBER_ID: "phone-id",
    WHATSAPP_APP_SECRET: "test-secret",
    WHATSAPP_VERIFY_TOKEN: "test-verify",
    WHATSAPP_ACCESS_TOKEN: "test-token",
    AGENT_RUNTIME: {
      ensureExternalUser: vi.fn(),
      submitExternalMessage: submit,
      interruptExternalRun: vi.fn(),
    },
  } as unknown as Env;
  actor = new WhatsAppConversation(
    {
      storage,
      waitUntil: (promise: Promise<unknown>) => jobs.push(promise),
      exports: {
        WhatsAppResponseTarget: ({
          props,
        }: {
          props: { messageId: string };
        }) => ({
          onGadgetResponse: ({ text }: { text: string }) =>
            actor.complete(props.messageId, text),
        }),
      },
    },
    env
  );
  return { actor, storage, submit, env, flush: () => Promise.all(jobs) };
}

afterEach(() => vi.unstubAllGlobals());

it("deduplicates concurrent receipts and callback replays", async () => {
  const send = vi.fn(async () =>
    Response.json({ messages: [{ id: "out-1" }] })
  );
  vi.stubGlobal("fetch", send);
  const h = harness();
  await Promise.all([h.actor.enqueue(message), h.actor.enqueue(message)]);
  await h.flush();
  await h.actor.complete(message.id, "replayed");
  await h.actor.alarm();
  expect(send).toHaveBeenCalledTimes(1);
  expect(h.submit).toHaveBeenCalledTimes(1);
  expect(await h.storage.get(`message:${message.id}`)).toMatchObject({
    state: "sent",
    text: "",
    providerId: "out-1",
  });
});

it("does not resend a send whose outcome was lost during a restart", async () => {
  const send = vi.fn();
  vi.stubGlobal("fetch", send);
  const storage = new Storage();
  await storage.put(`message:${message.id}`, {
    ...message,
    state: "sending",
    createdAt: 0,
    response: "reply",
  });
  await harness(storage).actor.alarm();
  expect(send).not.toHaveBeenCalled();
  expect(await storage.get(`message:${message.id}`)).toMatchObject({
    state: "failed",
  });
});

it("rejects the wrong sender before provisioning an agent", async () => {
  const h = harness();
  await expect(
    h.actor.enqueue({ ...message, sender: "15550000002" })
  ).rejects.toThrow("not authorized");
  expect(h.submit).not.toHaveBeenCalled();
});

it("retries a definitive rate-limit rejection without rerunning the agent", async () => {
  const send = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({ error: { message: "Rate limited" } }, { status: 429 })
    )
    .mockResolvedValueOnce(Response.json({ messages: [{ id: "out-2" }] }));
  vi.stubGlobal("fetch", send);
  const h = harness();
  await h.actor.enqueue(message);
  await h.flush();
  expect(await h.storage.get(`message:${message.id}`)).toMatchObject({
    state: "ready",
    sendAttempts: 1,
  });
  await h.actor.alarm();
  expect(send).toHaveBeenCalledTimes(2);
  expect(h.submit).toHaveBeenCalledTimes(1);
  expect(await h.storage.get(`message:${message.id}`)).toMatchObject({
    state: "sent",
  });
});

it("enforces the staging allowance before model invocation", async () => {
  const h = harness();
  await h.storage.put(`reserved:${new Date().toISOString().slice(0, 7)}`, 10);
  await expect(h.actor.enqueue(message)).rejects.toThrow("allowance exhausted");
  expect(h.submit).not.toHaveBeenCalled();
});

it("preserves a callback arriving while a timed-out run is interrupted", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ messages: [{ id: "out-late" }] }))
  );
  const h = harness();
  await h.storage.put(`message:${message.id}`, {
    ...message,
    state: "running",
    createdAt: 1,
    startedAt: 1,
  });
  vi.mocked(h.env.AGENT_RUNTIME!.interruptExternalRun).mockImplementation(
    async () => {
      await h.actor.complete(message.id, "Completed during interrupt");
    }
  );
  await h.actor.alarm();
  expect(await h.storage.get(`message:${message.id}`)).toMatchObject({
    state: "ready",
  });
  await h.actor.alarm();
  expect(await h.storage.get(`message:${message.id}`)).toMatchObject({
    state: "sent",
    providerId: "out-late",
  });
});
