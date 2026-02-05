/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: 'infrastructure',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      protect: ['production'].includes(input?.stage),
      home: 'aws',
      providers: {
        aws: {
          profile: 'delulu_social',
          region: 'us-east-1',
        },
      },
    };
  },
  // biome-ignore lint/suspicious/useAwait: <explanation>
  async run() {
    const vpc = new sst.aws.Vpc('MyVpc');
    const cluster = new sst.aws.Cluster('MyCluster', { vpc });

    // ============================================================================
    // SOCIAL POSTS QUEUE (existing)
    // ============================================================================
    const queue = new sst.aws.Queue('SocialPostsQueue');

    const SECRET_KEY = new sst.Secret('LAMBDA_SECRET_KEY');

    const triggerFunction = new sst.aws.Function('TriggerSqsFunction', {
      handler: 'src/trigger-sqs.handler',
      url: true, // Expose as HTTP endpoint
      link: [queue, SECRET_KEY],
    });

    const task = new sst.aws.Task('SocialPostsTask', {
      cluster,
      cpu: '0.5 vCPU',
      memory: '1 GB',
      publicIp: true,
      image: {
        context: '../..',
        dockerfile: 'packages/worker/Dockerfile',
      },
      environment: {
        QUEUE_URL: queue.url,
        DEBUG: 'true',
      },
      dev: false,
    });

    queue.subscribe({
      handler: 'src/trigger-task.handler',
      link: [task],
    });

    // ============================================================================
    // INSTAGRAM WEBHOOKS INFRASTRUCTURE
    // ============================================================================

    // Secrets for Instagram webhook processing
    const INSTAGRAM_WEBHOOK_VERIFY_TOKEN = new sst.Secret(
      'INSTAGRAM_WEBHOOK_VERIFY_TOKEN'
    );
    const INSTAGRAM_APP_SECRET = new sst.Secret('INSTAGRAM_APP_SECRET');
    const CONVEX_URL = new sst.Secret('CONVEX_URL');

    // Dead Letter Queue for failed webhook processing
    const instagramWebhooksDLQ = new sst.aws.Queue('InstagramWebhooksDLQ', {
      retentionPeriod: '14 days',
    });

    // Main Instagram Webhooks Queue
    const instagramWebhooksQueue = new sst.aws.Queue('InstagramWebhooksQueue', {
      dlq: {
        queue: instagramWebhooksDLQ.arn,
        retry: 3,
      },
      visibilityTimeout: '60 seconds',
    });

    // Lambda: Receives webhooks from Instagram (must respond <15s)
    const instagramWebhookReceiver = new sst.aws.Function(
      'InstagramWebhookReceiver',
      {
        handler: 'src/instagram-webhook-receiver.handler',
        url: true, // Expose as HTTP endpoint for Meta to call
        link: [
          instagramWebhooksQueue,
          INSTAGRAM_WEBHOOK_VERIFY_TOKEN,
          INSTAGRAM_APP_SECRET,
        ],
        timeout: '15 seconds',
        memory: '256 MB',
      }
    );

    // Lambda: Processes webhook events (SQS consumer)
    instagramWebhooksQueue.subscribe({
      handler: 'src/instagram-webhook-processor.handler',
      link: [CONVEX_URL, INSTAGRAM_APP_SECRET],
      timeout: '60 seconds',
      memory: '512 MB',
    });

    return {
      SocialPostsQueueURL: queue.url,
      SocialPostsApiEndpoint: triggerFunction.url,
      // Instagram Webhooks
      InstagramWebhookReceiverURL: instagramWebhookReceiver.url,
      InstagramWebhooksQueueURL: instagramWebhooksQueue.url,
      InstagramWebhooksDLQURL: instagramWebhooksDLQ.url,
    };
  },
});
