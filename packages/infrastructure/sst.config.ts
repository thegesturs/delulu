/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "infrastructure",
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
  // biome-ignore lint/suspicious/useAwait: SST config requires async run
  async run(input) {
    const isProduction = input?.stage === "production";
    // ============================================================================
    // COMMENTED OUT — keeping for potential future large upload support (2GB+ YT videos)
    // ============================================================================
    // const vpc = new sst.aws.Vpc("MyVpc");
    // const cluster = new sst.aws.Cluster("MyCluster", { vpc });
    // const task = new sst.aws.Task("SocialPostsTask", {
    //   cluster,
    //   cpu: "0.5 vCPU",
    //   memory: "1 GB",
    //   publicIp: true,
    //   image: {
    //     context: "../..",
    //     dockerfile: "packages/worker/Dockerfile",
    //   },
    //   environment: {
    //     QUEUE_URL: queue.url,
    //     DEBUG: "true",
    //   },
    //   dev: {
    //     command: "pnpm dev",
    //     directory: "packages/worker",
    //   },
    // });

    // ============================================================================
    // SOCIAL POSTS QUEUE
    // ============================================================================
    // Publish Pipeline v2 — dead-letter queue for poison messages. After
    // maxReceiveCount (5) failed receives, SQS moves the message here instead
    // of redelivering forever. Matches publish_jobs.maxAttempts default.
    const deadLetterQueue = new sst.aws.Queue("SocialPostsDLQ");

    const queue = new sst.aws.Queue("SocialPostsQueue", {
      visibilityTimeout: "15 minutes",
      dlq: {
        queue: deadLetterQueue.arn,
        retry: 5,
      },
    });

    const SECRET_KEY = new sst.Secret("LAMBDA_SECRET_KEY");
    const INSTAGRAM_APP_SECRET = new sst.Secret("INSTAGRAM_APP_SECRET");
    const INSTAGRAM_WEBHOOK_VERIFY_TOKEN = new sst.Secret(
      "INSTAGRAM_WEBHOOK_VERIFY_TOKEN"
    );
    const CONVEX_URL = new sst.Secret("CONVEX_URL");
    const GROQ_API_KEY = new sst.Secret("GROQ_API_KEY");
    const CLERK_SECRET_KEY = new sst.Secret("CLERK_SECRET_KEY");
    const DODO_PAYMENTS_API_KEY = new sst.Secret("DODO_PAYMENTS_API_KEY");
    // Cloudflare KV trigger cache — Lambda reads, Convex writes. If any of
    // these three is unset, the Lambda fails open and calls Convex directly.
    const CF_ACCOUNT_ID = new sst.Secret("CF_ACCOUNT_ID");
    const CF_KV_NAMESPACE_ID = new sst.Secret("CF_KV_NAMESPACE_ID");
    const CF_KV_API_TOKEN = new sst.Secret("CF_KV_API_TOKEN");

    // Trigger endpoint — receives HTTP from Convex, enqueues to SQS (UNCHANGED)
    const triggerFunction = new sst.aws.Function("TriggerSqsFunction", {
      handler: "src/trigger-sqs.handler",
      url: true,
      link: [queue, SECRET_KEY],
    });

    // Worker Lambda — processes one SQS message per invocation
    // (replaces: trigger-task Lambda → ECS Task)
    queue.subscribe(
      {
        handler: "src/social-post-worker.handler",
        timeout: "10 minutes",
        memory: "1024 MB",
        link: [CONVEX_URL],
        environment: {
          NEXT_PUBLIC_CONVEX_URL: CONVEX_URL.value,
          // Publish Pipeline v2 rollout flag + shared secret. Baked at deploy
          // from the deployer's env; default off so behavior is unchanged.
          PUBLISH_PIPELINE_V2: process.env.PUBLISH_PIPELINE_V2 ?? "off",
          PUBLISH_PIPELINE_SECRET: process.env.PUBLISH_PIPELINE_SECRET ?? "",
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
    // INSTAGRAM WEBHOOK
    // ============================================================================
    const instagramWebhook = new sst.aws.Function("InstagramWebhook", {
      handler: "src/instagram-webhook.handler",
      url: true,
      link: [
        SECRET_KEY,
        INSTAGRAM_APP_SECRET,
        INSTAGRAM_WEBHOOK_VERIFY_TOKEN,
        CONVEX_URL,
        CF_ACCOUNT_ID,
        CF_KV_NAMESPACE_ID,
        CF_KV_API_TOKEN,
      ],
      environment: {
        CF_ACCOUNT_ID: CF_ACCOUNT_ID.value,
        CF_KV_NAMESPACE_ID: CF_KV_NAMESPACE_ID.value,
        CF_KV_API_TOKEN: CF_KV_API_TOKEN.value,
      },
      timeout: "30 seconds",
    });

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
          CONVEX_URL,
          SECRET_KEY,
          DODO_PAYMENTS_API_KEY,
        ],
        timeout: "120 seconds",
        memory: "1024 MB",
        environment: {
          ENVIRONMENT: isProduction ? "production" : "development",
        },
      }
    );

    return {
      SocialPostsQueueURL: queue.url,
      SocialPostsApiEndpoint: triggerFunction.url,
      InstagramWebhookURL: instagramWebhook.url,
      TranscriptionApiEndpoint: transcriptionFunction.url,
    };
  },
});
