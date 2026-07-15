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
        // Builds + pushes the YouTube trimmer container image to ECR as part of
        // `sst deploy` (see awsx.ecr.Image below). Added via `sst add awsx`.
        awsx: "3.7.0",
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
    // YouTube trimmer (marketing /tools). The container image is built + pushed
    // to ECR by `sst deploy` (awsx.ecr.Image below) — no manual docker/ECR steps.
    // Auth secret is the shared bearer the web route sends so the public Function
    // URL can't be abused directly.
    const YOUTUBE_TRIMMER_AUTH = new sst.Secret("YoutubeTrimmerAuthSecret");

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

    // ============================================================================
    // YOUTUBE TRIMMER FUNCTION (marketing /tools)
    // Container image (yt-dlp + ffmpeg) — can't run on Cloudflare Workers.
    // Raw aws.* resources because sst.aws.Function is zip-only (no container image).
    //
    // awsx.ecr.Image builds the Dockerfile and pushes it to a managed ECR repo
    // during `sst deploy` (needs the local Docker daemon running). No separate
    // build/push script or image-URI secret — one command deploys everything.
    // ============================================================================
    const trimmerRepo = new awsx.ecr.Repository("YoutubeTrimmerRepo", {
      // Keep only the last few images so ECR storage doesn't grow unbounded.
      lifecyclePolicy: {
        rules: [
          {
            tagStatus: "any",
            maximumNumberOfImages: 5,
            description: "Keep last 5 images",
          },
        ],
      },
      forceDelete: true,
    });
    const trimmerImage = new awsx.ecr.Image("YoutubeTrimmerImage", {
      repositoryUrl: trimmerRepo.url,
      context: "youtube-trimmer",
      dockerfile: "youtube-trimmer/Dockerfile",
      // Lambda runs x86_64 (see architectures below); build must match.
      platform: "linux/amd64",
    });

    const trimmerRole = new aws.iam.Role("YoutubeTrimmerRole", {
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: { Service: "lambda.amazonaws.com" },
          },
        ],
      }),
    });
    new aws.iam.RolePolicyAttachment("YoutubeTrimmerLogs", {
      role: trimmerRole.name,
      policyArn:
        "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    });
    const trimmerFunction = new aws.lambda.Function("YoutubeTrimmerFunction", {
      packageType: "Image",
      imageUri: trimmerImage.imageUri,
      role: trimmerRole.arn,
      architectures: ["x86_64"],
      memorySize: 2048,
      timeout: 120,
      // Hard cap on parallel invocations: bounds cost and avoids hammering
      // YouTube from our IP (which would get us rate-limited faster).
      reservedConcurrentExecutions: 5,
      environment: {
        variables: {
          TRIM_SECRET: YOUTUBE_TRIMMER_AUTH.value,
          MAX_CLIP_SECONDS: "600",
        },
      },
    });
    const trimmerUrl = new aws.lambda.FunctionUrl("YoutubeTrimmerUrl", {
      functionName: trimmerFunction.name,
      authorizationType: "NONE",
      invokeMode: "RESPONSE_STREAM",
      cors: {
        allowOrigins: ["*"],
        allowMethods: ["POST"],
        allowHeaders: ["content-type", "x-trim-secret"],
        maxAge: 86_400,
      },
    });

    return {
      PostgresSocialPostsApiEndpoint: postgresTrigger.url,
      TranscriptionApiEndpoint: transcriptionFunction.url,
      YoutubeTrimmerApiEndpoint: trimmerUrl.functionUrl,
    };
  },
});
