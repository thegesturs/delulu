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

    const queue = new sst.aws.Queue('SocialPostsQueue');

    const SECRET_KEY = new sst.Secret('LAMBDA_SECRET_KEY');

    // Add new API + Lambda function to trigger SQS
    const api = new sst.aws.ApiGatewayV2('SocialPostsApi', {
      link: [queue, SECRET_KEY],
    });

    api.route('POST /trigger', 'src/trigger-sqs.handler');

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
      },
    });

    queue.subscribe({
      handler: 'src/trigger-task.handler',
      link: [task],
    });

    return {
      SocialPostsQueueURL: queue.url,
      SocialPostsApiEndpoint: api.url,
    };
  },
});
