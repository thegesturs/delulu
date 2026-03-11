/**
 * REST API client — wraps the Delulu public API.
 */
const TRAILING_SLASH = /\/$/;

export class DeluluApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(TRAILING_SLASH, "");
    this.apiKey = apiKey;
  }

  private async request(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ) {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
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
    const query = new URLSearchParams();
    if (params?.status) {
      query.set("status", params.status);
    }
    if (params?.limit) {
      query.set("limit", params.limit.toString());
    }
    if (params?.cursor) {
      query.set("cursor", params.cursor);
    }
    const qs = query.toString();
    return this.request("GET", `/v1/posts${qs ? `?${qs}` : ""}`);
  }

  async getPost(id: string) {
    return this.request("GET", `/v1/posts/${id}`);
  }

  async createPost(data: Record<string, unknown>) {
    return this.request("POST", "/v1/posts", data);
  }

  async updatePost(id: string, data: Record<string, unknown>) {
    return this.request("PATCH", `/v1/posts/${id}`, data);
  }

  async deletePost(id: string) {
    return this.request("DELETE", `/v1/posts/${id}`);
  }

  // Accounts
  async listAccounts() {
    return this.request("GET", "/v1/accounts");
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
