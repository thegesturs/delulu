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
          profile: "delulu_social",
          region: "us-east-1",
        },
      },
    };
  },
  // biome-ignore lint/suspicious/useAwait: <explanation>
  async run() {
    const vpc = new sst.aws.Vpc("MyVpc");
    const cluster = new sst.aws.Cluster("MyCluster", { vpc });

    // ============================================================================
    // SOCIAL POSTS QUEUE (existing)
    // ============================================================================
    const queue = new sst.aws.Queue("SocialPostsQueue");

    const SECRET_KEY = new sst.Secret("LAMBDA_SECRET_KEY");
    const INSTAGRAM_APP_SECRET = new sst.Secret("INSTAGRAM_APP_SECRET");
    const INSTAGRAM_WEBHOOK_VERIFY_TOKEN = new sst.Secret(
      "INSTAGRAM_WEBHOOK_VERIFY_TOKEN"
    );
    const CONVEX_URL = new sst.Secret("CONVEX_URL");

    const triggerFunction = new sst.aws.Function("TriggerSqsFunction", {
      handler: "src/trigger-sqs.handler",
      url: true, // Expose as HTTP endpoint
      link: [queue, SECRET_KEY],
    });

    const task = new sst.aws.Task("SocialPostsTask", {
      cluster,
      cpu: "0.5 vCPU",
      memory: "1 GB",
      publicIp: true,
      image: {
        context: "../..",
        dockerfile: "packages/worker/Dockerfile",
      },
      environment: {
        QUEUE_URL: queue.url,
        DEBUG: "true",
      },
      dev: {
        command: "pnpm dev",
        directory: "packages/worker",
      },
    });

    queue.subscribe({
      handler: "src/trigger-task.handler",
      link: [task],
    });

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
      ],
      timeout: "30 seconds",
    });

    return {
      SocialPostsQueueURL: queue.url,
      SocialPostsApiEndpoint: triggerFunction.url,
      InstagramWebhookURL: instagramWebhook.url,
    };
  },
});
