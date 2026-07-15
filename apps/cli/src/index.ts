#!/usr/bin/env node
import {
  cancel,
  confirm,
  isCancel,
  multiselect,
  select,
  text,
} from "@clack/prompts";
import { type ApiClient, makeSimplePostWrite, runEffect } from "@delulu/client";
import { Command } from "commander";
import { getContractClient, getWorkspaceId, printResult } from "./api.js";
import { deleteCredentials } from "./config.js";
import { login } from "./oauth.js";
import {
  reportInvocation,
  shutdownTelemetry,
  trackCommand,
} from "./telemetry.js";
import { uploadLocalMedia } from "./upload.js";

interface GlobalOptions {
  apiUrl?: string;
  json?: boolean;
  workspace?: string;
}

const program = new Command();
program
  .name("delulu")
  .description("Delulu Social CLI")
  .option("--api-url <url>", "Delulu API URL")
  .option("--workspace <id>", "Workspace ID for this command")
  .option("--json", "Print JSON output");

// Record which command ran, for a single metadata-only analytics event per
// invocation (fired from the parse handlers below). The full command path
// (e.g. "posts create") is reconstructed from the action command's ancestry.
program.hook("preAction", (_thisCommand, actionCommand) => {
  const parts: string[] = [];
  for (
    let current: Command | null = actionCommand;
    current && current !== program;
    current = current.parent
  ) {
    parts.unshift(current.name());
  }
  trackCommand(parts.join(" ") || actionCommand.name());
});

program
  .command("login")
  .option("--client-id <id>", "OAuth client id")
  .option("--issuer <url>", "Application OAuth issuer URL")
  .option("--loopback", "Use browser callback PKCE instead of device login")
  .action(async (options) => {
    await login(options);
  });

program.command("logout").action(async () => {
  await deleteCredentials();
  console.log("Logged out.");
});

program.command("whoami").action(async () => {
  const options = program.opts<GlobalOptions>();
  const result = await runEffect(getContractClient(options).me.current());
  printResult(result, options.json);
});

const workspaces = program
  .command("workspaces")
  .description("Select a workspace");
workspaces.command("list").action(async () => {
  const options = program.opts<GlobalOptions>();
  printResult(
    await runEffect(getContractClient(options).me.workspaces()),
    options.json
  );
});

const setup = program.command("setup").description("Agent-led setup status");
setup.command("status").action(async () => {
  const options = program.opts<GlobalOptions>();
  const workspaceId = await getWorkspaceId(options);
  printResult(
    await runEffect(
      getContractClient(options).me.setup({ params: { workspaceId } })
    ),
    options.json
  );
});

const accounts = program.command("accounts").description("Manage accounts");
accounts.command("list").action(async () => {
  const options = program.opts<GlobalOptions>();
  const workspaceId = await getWorkspaceId(options);
  const result = await runEffect(
    getContractClient(options).connections.list({
      params: { workspaceId },
      query: {},
    })
  );
  printResult(result, options.json);
});
accounts
  .command("connect <platform>")
  .option("--insights", "Request provider insights permissions", true)
  .action(async (platform, cmd) => {
    const options = program.opts<GlobalOptions>();
    const workspaceId = await getWorkspaceId(options);
    const result = await runEffect(
      getContractClient(options).connections.mint({
        params: { workspaceId, platform },
        payload: { includeInsights: Boolean(cmd.insights) },
      })
    );
    printResult(result, options.json);
  });

const billing = program.command("billing").description("Manage billing setup");
billing
  .command("checkout")
  .requiredOption("--plan <plan>", "ECHO or VIBE")
  .requiredOption("--interval <interval>", "MONTHLY or YEARLY")
  .option("--currency <currency>", "USD or INR", "USD")
  .action(async (cmd) => {
    const options = program.opts<GlobalOptions>();
    const workspaceId = await getWorkspaceId(options);
    const plan = String(cmd.plan).toUpperCase();
    const interval = String(cmd.interval).toUpperCase();
    const currency = String(cmd.currency).toUpperCase();
    if (!(plan === "ECHO" || plan === "VIBE")) {
      throw new Error("--plan must be ECHO or VIBE");
    }
    if (!(interval === "MONTHLY" || interval === "YEARLY")) {
      throw new Error("--interval must be MONTHLY or YEARLY");
    }
    if (!(currency === "USD" || currency === "INR")) {
      throw new Error("--currency must be USD or INR");
    }
    printResult(
      await runEffect(
        getContractClient(options).billing.checkout({
          params: { workspaceId },
          payload: { plan, interval, currency },
        })
      ),
      options.json
    );
  });

const media = program.command("media").description("Upload and import media");
media
  .command("import <url>")
  .option("--filename <name>")
  .option("--alt <text>")
  .option("--idempotency-key <key>")
  .action(async (url, cmd) => {
    const options = program.opts<GlobalOptions>();
    const workspaceId = await getWorkspaceId(options);
    printResult(
      await runEffect(
        getContractClient(options).media.import({
          params: { workspaceId },
          payload: {
            url,
            filename: cmd.filename,
            altText: cmd.alt,
            idempotencyKey: cmd.idempotencyKey,
          },
        })
      ),
      options.json
    );
  });

media
  .command("upload <path>")
  .option("--alt <text>")
  .action(async (path, cmd) => {
    const options = program.opts<GlobalOptions>();
    const workspaceId = await getWorkspaceId(options);
    printResult(
      await uploadLocalMedia({
        client: getContractClient(options),
        workspaceId,
        path,
        altText: cmd.alt,
      }),
      options.json
    );
  });

const stats = program.command("stats").description("View stats");
stats.command("usage").action(async () => {
  const options = program.opts<GlobalOptions>();
  const workspaceId = await getWorkspaceId(options);
  const result = await runEffect(
    getContractClient(options).billing.usage({ params: { workspaceId } })
  );
  printResult(result, options.json);
});
stats.command("subscription").action(async () => {
  const options = program.opts<GlobalOptions>();
  const workspaceId = await getWorkspaceId(options);
  const result = await runEffect(
    getContractClient(options).billing.subscription({
      params: { workspaceId },
    })
  );
  printResult(result, options.json);
});

const posts = program.command("posts").description("Manage posts");

posts
  .command("list")
  .option("--status <status>", "Filter by status")
  .option("--limit <limit>", "Number of posts to return", "20")
  .option("--cursor <cursor>", "Pagination cursor")
  .action(async (cmd) => {
    const options = program.opts<GlobalOptions>();
    const offset = cmd.cursor === undefined ? undefined : Number(cmd.cursor);
    if (offset !== undefined && !Number.isSafeInteger(offset)) {
      throw new Error(
        "The workspace API accepts a numeric offset for --cursor."
      );
    }
    const workspaceId = await getWorkspaceId(options);
    const result = await runEffect(
      getContractClient(options).posts.list({
        params: { workspaceId },
        query: {
          ...(cmd.status ? { status: cmd.status } : {}),
          ...(cmd.limit ? { limit: Number(cmd.limit) } : {}),
          ...(offset === undefined ? {} : { offset }),
        },
      })
    );
    printResult(result, options.json);
  });

posts.command("get <id>").action(async (id) => {
  const options = program.opts<GlobalOptions>();
  const workspaceId = await getWorkspaceId(options);
  const result = await runEffect(
    getContractClient(options).posts.get({ params: { workspaceId, id } })
  );
  printResult(result, options.json);
});

posts
  .command("create")
  .option("--caption <caption>", "Post caption")
  .option("--account <id...>", "Account IDs")
  .option("--media <id...>", "Completed media IDs")
  .option("--status <status>", "Post status", "SAVED")
  .option("--intent <intent>", "draft, schedule, or publish_now")
  .option("--scheduled-at <timestamp>", "Unix timestamp for scheduling")
  .option("--privacy <status>", "Privacy status")
  .action(async (cmd) => {
    const options = program.opts<GlobalOptions>();
    const client = getContractClient(options);
    const workspaceId = await getWorkspaceId(options);
    const payload = await commandPostPayload(client, workspaceId, {
      caption: cmd.caption || "",
      accounts: cmd.account || [],
      media: cmd.media || [],
      status: cmd.status,
      scheduledAt: cmd.scheduledAt ? Number(cmd.scheduledAt) : undefined,
      privacy: cmd.privacy,
    });
    const created = await runEffect(
      client.posts.create({ params: { workspaceId }, payload })
    );
    const intent =
      cmd.intent ?? (cmd.status === "SCHEDULED" ? "schedule" : "draft");
    const result =
      intent === "publish_now" && created.status !== "pending_review"
        ? await runEffect(
            client.posts.publishNow({ params: { workspaceId, id: created.id } })
          )
        : created;
    printResult(result, options.json);
  });

posts
  .command("schedule")
  .description("Interactively schedule a post")
  .action(async () => {
    const options = program.opts<GlobalOptions>();
    const workspaceId = await getWorkspaceId(options);
    const accountsResult = await runEffect(
      getContractClient(options).connections.list({
        params: { workspaceId },
        query: {},
      })
    );
    const selectedAccounts = await multiselect({
      message: "Select accounts",
      options: (accountsResult.data || []).map((account) => ({
        value: account.id,
        label: `${account.platform || "account"} ${account.username || account.id}`,
      })),
      required: false,
    });
    if (isCancel(selectedAccounts)) {
      cancel("Cancelled.");
      process.exit(0);
    }

    const caption = await text({ message: "Caption" });
    if (isCancel(caption)) {
      cancel("Cancelled.");
      process.exit(0);
    }

    const media = await text({
      message: "Completed media IDs, comma-separated",
      placeholder: "media_...",
    });
    if (isCancel(media)) {
      cancel("Cancelled.");
      process.exit(0);
    }

    const scheduledAt = await text({
      message: "Scheduled time as Unix timestamp",
      placeholder: Math.floor(Date.now() / 1000 + 3600).toString(),
    });
    if (isCancel(scheduledAt)) {
      cancel("Cancelled.");
      process.exit(0);
    }

    const privacy = await select({
      message: "Privacy",
      options: [
        { value: "PUBLIC", label: "Public" },
        { value: "PRIVATE", label: "Private" },
        { value: "UNLISTED", label: "Unlisted" },
      ],
      initialValue: "PUBLIC",
    });
    if (isCancel(privacy)) {
      cancel("Cancelled.");
      process.exit(0);
    }

    const shouldCreate = await confirm({
      message: "Create scheduled post?",
      initialValue: true,
    });
    if (isCancel(shouldCreate) || !shouldCreate) {
      cancel("Cancelled.");
      process.exit(0);
    }

    const client = getContractClient(options);
    const payload = await commandPostPayload(client, workspaceId, {
      caption: caption.toString(),
      accounts: selectedAccounts.map(String),
      media: media
        .toString()
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      status: "SCHEDULED",
      scheduledAt: Number(scheduledAt),
      privacy: privacy.toString(),
    });
    const result = await runEffect(
      client.posts.create({ params: { workspaceId }, payload })
    );
    printResult(result, options.json);
  });

posts
  .command("update <id>")
  .option("--caption <caption>", "Updated caption")
  .option("--status <status>", "Updated status")
  .option("--scheduled-at <timestamp>", "Updated Unix timestamp")
  .action(async (id, cmd) => {
    const options = program.opts<GlobalOptions>();
    const client = getContractClient(options);
    const workspaceId = await getWorkspaceId(options);
    const current = await runEffect(
      client.posts.get({ params: { workspaceId, id } })
    );
    const scheduledAt = commandSchedule(cmd.status, cmd.scheduledAt);
    const payload = {
      groups: current.groups.map((group, groupIndex) => ({
        ...group,
        segments: group.segments.map((segment, segmentIndex) => ({
          ...segment,
          text:
            groupIndex === 0 && segmentIndex === 0 && cmd.caption !== undefined
              ? cmd.caption
              : segment.text,
        })),
      })),
      targets: current.targets.map((target) => ({
        connectionId: target.connectionId,
        groupId: target.groupId,
        settings: target.settings,
        scheduledAt:
          scheduledAt === undefined ? target.scheduledAt : scheduledAt,
      })),
      source: current.source,
      ...(current.externalSubmissionId
        ? { externalSubmissionId: current.externalSubmissionId }
        : {}),
    };
    const result = await runEffect(
      client.posts.update({ params: { workspaceId, id }, payload })
    );
    printResult(result, options.json);
  });

posts.command("delete <id>").action(async (id) => {
  const options = program.opts<GlobalOptions>();
  const workspaceId = await getWorkspaceId(options);
  const result = await runEffect(
    getContractClient(options).posts.remove({ params: { workspaceId, id } })
  );
  printResult(result, options.json);
});

posts.command("publish <id>").action(async (id) => {
  const options = program.opts<GlobalOptions>();
  const workspaceId = await getWorkspaceId(options);
  printResult(
    await runEffect(
      getContractClient(options).posts.publishNow({
        params: { workspaceId, id },
      })
    ),
    options.json
  );
});

const commandSchedule = (
  status?: string,
  scheduledAt?: string | number
): string | null | undefined => {
  if (scheduledAt !== undefined) {
    const seconds = Number(scheduledAt);
    if (!Number.isFinite(seconds)) {
      throw new Error("Scheduled time must be a Unix timestamp");
    }
    return new Date(seconds * 1000).toISOString();
  }
  if (status === "SAVED") {
    return null;
  }
  if (status === "SCHEDULED") {
    throw new Error("SCHEDULED posts require --scheduled-at");
  }
  return undefined;
};

async function commandPostPayload(
  client: ApiClient,
  workspaceId: string,
  input: {
    caption: string;
    accounts: string[];
    media: string[];
    status?: string;
    scheduledAt?: number;
    privacy?: string;
  }
) {
  const connections = await runEffect(
    client.connections.list({ params: { workspaceId }, query: {} })
  );
  const selected = input.accounts.map((id) => {
    const connection = connections.data.find((item) => item.id === id);
    if (!connection) {
      throw new Error(`Connection ${id} is not in the selected workspace`);
    }
    return connection;
  });
  return makeSimplePostWrite({
    caption: input.caption,
    connections: selected,
    mediaIds: input.media,
    scheduledAt: commandSchedule(input.status, input.scheduledAt) ?? null,
    privacy: input.privacy,
  });
}

program
  .parseAsync(process.argv)
  .then(async () => {
    await reportInvocation(true);
    await shutdownTelemetry();
  })
  .catch(async (error) => {
    console.error(error instanceof Error ? error.message : String(error));
    await reportInvocation(false);
    await shutdownTelemetry();
    process.exit(1);
  });
