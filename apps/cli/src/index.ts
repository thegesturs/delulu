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

interface GlobalOptions {
  apiUrl?: string;
  json?: boolean;
}

const program = new Command();
program
  .name("delulu")
  .description("Delulu Social CLI")
  .option("--api-url <url>", "Delulu API URL")
  .option("--json", "Print JSON output");

program
  .command("login")
  .option("--client-id <id>", "Clerk OAuth application client id")
  .option("--issuer <url>", "Clerk OAuth issuer URL")
  .option(
    "--publishable-key <key>",
    "Clerk publishable key used to derive issuer"
  )
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
    const result = await runEffect(
      client.posts.create({ params: { workspaceId }, payload })
    );
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

program.parseAsync(process.argv).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
