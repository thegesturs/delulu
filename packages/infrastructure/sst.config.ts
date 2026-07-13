/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "infrastructure",
      // SST's `retain` policy only retains its documented stateful resource
      // types (buckets, databases, and tables). Removed queues and functions
      // are still deleted by `sst deploy`, which is required for this cutover.
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: {
          // In GitHub Actions credentials come from the assumed OIDC role
          // (exported as env vars), so no named profile exists there. Locally
          // we keep using the delulu_social SSO profile.
          profile: process.env.GITHUB_ACTIONS ? undefined : "delulu_social",
          region: "us-east-1",
        },
      },
    };
  },
  async run() {
    const isProduction = $app.stage === "production";
    const SECRET_KEY = new sst.Secret("LAMBDA_SECRET_KEY");
    const GROQ_API_KEY = new sst.Secret("GROQ_API_KEY");
    const CLERK_SECRET_KEY = new sst.Secret("CLERK_SECRET_KEY");
    const DODO_PAYMENTS_API_KEY = new sst.Secret("DODO_PAYMENTS_API_KEY");
    const POSTGRES_DATABASE_URL = new sst.Secret("POSTGRES_DATABASE_URL");
    const ENCRYPTION_SECRET = new sst.Secret("ENCRYPTION_SECRET");

    // Primary publishing lane. Existing logical names remain stable so the
    // cutover updates resources in place instead of replacing the queue.
    const postgresDeadLetterQueue = new sst.aws.Queue("PostgresSocialPostsDLQ");
    const postgresQueue = new sst.aws.Queue("PostgresSocialPostsQueue", {
      visibilityTimeout: "60 minutes",
      dlq: { queue: postgresDeadLetterQueue.arn, retry: 5 },
    });
    const postgresTrigger = new sst.aws.Function("PostgresTriggerSqsFunction", {
      handler: "src/trigger-postgres-sqs.handler",
      url: true,
      link: [postgresQueue, SECRET_KEY],
      environment: { QUEUE_URL: postgresQueue.url },
    });
    postgresQueue.subscribe(
      {
        handler: "src/postgres-social-post-worker.handler",
        timeout: "10 minutes",
        memory: "1024 MB",
        link: [POSTGRES_DATABASE_URL, ENCRYPTION_SECRET],
        environment: {
          DATABASE_URL: POSTGRES_DATABASE_URL.value,
          ENCRYPTION_SECRET: ENCRYPTION_SECRET.value,
        },
        copyFiles: [{ from: "../worker/.env.prod", to: ".env.prod" }],
        nodejs: {
          install: ["googleapis"],
          esbuild: { external: ["googleapis"] },
        },
      },
      { batch: { size: 1 } }
    );

    // ============================================================================
    // TRANSCRIPTION FUNCTION (Sorted extension)
    // ============================================================================
    const transcriptionFunction = new sst.aws.Function(
      "TranscriptionFunction",
      {
        handler: "src/transcription.handler",
        url: {
          cors: {
            allowOrigins: ["*"],
            allowMethods: ["*"],
            allowHeaders: ["Content-Type", "Authorization"],
          },
        },
        link: [
          GROQ_API_KEY,
          CLERK_SECRET_KEY,
          POSTGRES_DATABASE_URL,
          DODO_PAYMENTS_API_KEY,
        ],
        timeout: "120 seconds",
        memory: "1024 MB",
        environment: {
          ENVIRONMENT: isProduction ? "production" : "development",
          DATABASE_URL: POSTGRES_DATABASE_URL.value,
        },
      }
    );

    return {
      PostgresSocialPostsApiEndpoint: postgresTrigger.url,
      TranscriptionApiEndpoint: transcriptionFunction.url,
    };
  },
});
