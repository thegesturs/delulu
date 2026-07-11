/**
 * REST API client — wraps the Delulu public API.
 */
import {
  type ApiClient,
  createApiClient,
  makeSimplePostWrite,
  resolveWorkspaceId,
  runEffect,
} from "@delulu/client";

const TRAILING_SLASH = /\/$/;

export class DeluluApiClient {
  private readonly client: ApiClient;
  private workspaceId: string | undefined;

  constructor(
    baseUrl: string,
    token: string | (() => string | Promise<string>)
  ) {
    const resolvedBaseUrl = baseUrl.replace(TRAILING_SLASH, "");
    const getToken = typeof token === "function" ? token : () => token;
    this.client = createApiClient({
      baseUrl: resolvedBaseUrl,
      getToken,
    });
  }

  private async resolveWorkspaceId() {
    if (this.workspaceId) {
      return this.workspaceId;
    }
    this.workspaceId = await resolveWorkspaceId({
      client: this.client,
      workspaceId: process.env.DELULU_WORKSPACE_ID,
    });
    return this.workspaceId;
  }

  // Posts
  async listPosts(params?: {
    status?: string;
    limit?: number;
    cursor?: string;
  }) {
    const offset =
      params?.cursor === undefined ? undefined : Number(params.cursor);
    if (offset !== undefined && !Number.isSafeInteger(offset)) {
      throw new Error("The workspace API accepts a numeric pagination cursor.");
    }
    const workspaceId = await this.resolveWorkspaceId();
    return runEffect(
      this.client.posts.list({
        params: { workspaceId },
        query: {
          ...(params?.status ? { status: params.status } : {}),
          ...(params?.limit ? { limit: params.limit } : {}),
          ...(offset === undefined ? {} : { offset }),
        },
      })
    );
  }

  async getPost(id: string) {
    const workspaceId = await this.resolveWorkspaceId();
    return runEffect(this.client.posts.get({ params: { workspaceId, id } }));
  }

  async createPost(data: McpPostInput) {
    const workspaceId = await this.resolveWorkspaceId();
    const connections = await this.selectedConnections(
      workspaceId,
      data.socialProviderIds
    );
    const payload = makeSimplePostWrite({
      caption: data.content.map((segment) => segment.text).join("\n\n"),
      connections,
      mediaIds: data.content.flatMap((segment) =>
        segment.media.map((media) => media.id)
      ),
      scheduledAt:
        data.status === "SCHEDULED" && data.scheduledAt
          ? new Date(data.scheduledAt * 1000).toISOString()
          : null,
      privacy: data.privacyStatus,
    });
    return runEffect(
      this.client.posts.create({ params: { workspaceId }, payload })
    );
  }

  async updatePost(id: string, data: Partial<McpPostInput>) {
    const workspaceId = await this.resolveWorkspaceId();
    const current = await runEffect(
      this.client.posts.get({ params: { workspaceId, id } })
    );
    const connectionIds = data.socialProviderIds ?? [
      ...new Set(current.targets.map((target) => target.connectionId)),
    ];
    const connections = await this.selectedConnections(
      workspaceId,
      connectionIds
    );
    const currentCaption = current.groups
      .flatMap((group) => group.segments.map((segment) => segment.text))
      .join("\n\n");
    const currentMediaIds = current.groups.flatMap((group) =>
      group.segments.flatMap((segment) =>
        segment.media.map((media) => media.id)
      )
    );
    const payload = makeSimplePostWrite({
      caption:
        data.content?.map((segment) => segment.text).join("\n\n") ??
        currentCaption,
      connections,
      mediaIds:
        data.content?.flatMap((segment) =>
          segment.media.map((media) => media.id)
        ) ?? currentMediaIds,
      scheduledAt:
        data.status === "SAVED"
          ? null
          : data.scheduledAt
            ? new Date(data.scheduledAt * 1000).toISOString()
            : current.targets[0]?.scheduledAt,
      privacy: data.privacyStatus,
    });
    return runEffect(
      this.client.posts.update({ params: { workspaceId, id }, payload })
    );
  }

  async deletePost(id: string) {
    const workspaceId = await this.resolveWorkspaceId();
    return runEffect(this.client.posts.remove({ params: { workspaceId, id } }));
  }

  // Accounts
  async listAccounts() {
    const workspaceId = await this.resolveWorkspaceId();
    return runEffect(
      this.client.connections.list({
        params: { workspaceId },
        query: {},
      })
    );
  }

  async getAccount(id: string) {
    const result = await this.listAccounts();
    const account = result.data.find((item) => item.id === id);
    if (!account) {
      throw new Error(`Connection ${id} was not found in the workspace`);
    }
    return account;
  }

  // Stats
  async getUsage() {
    const workspaceId = await this.resolveWorkspaceId();
    return runEffect(this.client.billing.usage({ params: { workspaceId } }));
  }

  async getSubscription() {
    const workspaceId = await this.resolveWorkspaceId();
    return runEffect(
      this.client.billing.subscription({ params: { workspaceId } })
    );
  }

  private async selectedConnections(
    workspaceId: string,
    connectionIds: readonly string[]
  ) {
    const result = await runEffect(
      this.client.connections.list({ params: { workspaceId }, query: {} })
    );
    return connectionIds.map((id) => {
      const connection = result.data.find((item) => item.id === id);
      if (!connection) {
        throw new Error(`Connection ${id} was not found in the workspace`);
      }
      return connection;
    });
  }
}

interface McpPostInput {
  readonly content: readonly {
    readonly text: string;
    readonly media: readonly { readonly id: string }[];
  }[];
  readonly socialProviderIds: readonly string[];
  readonly status: "SAVED" | "SCHEDULED";
  readonly scheduledAt?: number;
  readonly privacyStatus?: string;
}
