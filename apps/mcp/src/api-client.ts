/**
 * REST API client — wraps the Delulu public API.
 */
import {
  type ApiClient,
  createApiClient,
  resolveWorkspaceId,
  runEffect,
} from "@delulu/client";

const TRAILING_SLASH = /\/$/;

export class DeluluApiClient {
  private readonly baseUrl: string;
  private readonly getToken: () => string | Promise<string>;
  private readonly client: ApiClient;
  private workspaceId: string | undefined;

  constructor(
    baseUrl: string,
    token: string | (() => string | Promise<string>)
  ) {
    this.baseUrl = baseUrl.replace(TRAILING_SLASH, "");
    this.getToken = typeof token === "function" ? token : () => token;
    this.client = createApiClient({
      baseUrl: this.baseUrl,
      getToken: this.getToken,
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

  private async request(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ) {
    const url = `${this.baseUrl}${path}`;
    const token = await this.getToken();
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      ...(body && { body: JSON.stringify(body) }),
    });

    const json = await response.json();

    if (!response.ok) {
      const error = (json as Record<string, unknown>).error as
        | { message?: string }
        | undefined;
      throw new Error(
        `API error ${response.status}: ${error?.message || "Unknown error"}`
      );
    }

    return json;
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

  async createPost(data: Record<string, unknown>) {
    return this.request("POST", "/v1/posts", data);
  }

  async updatePost(id: string, data: Record<string, unknown>) {
    return this.request("PATCH", `/v1/posts/${id}`, data);
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
    return this.request("GET", `/v1/accounts/${id}`);
  }

  // Stats
  async getUsage() {
    return this.request("GET", "/v1/stats/usage");
  }

  async getSubscription() {
    return this.request("GET", "/v1/stats/subscription");
  }
}
