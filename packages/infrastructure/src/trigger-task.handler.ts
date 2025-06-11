// src/trigger-task.handler.js
import { Resource } from 'sst';
import { task } from 'sst/aws/task';

export async function handler(event) {
  for (const record of event.Records) {
    await task.run(Resource.SocialPostsTask, {
      // Pass message body or attributes as needed
      overrides: {
        containerOverrides: [
          {
            name: 'app', // container name in your Task definition
            environment: [{ name: 'MESSAGE_BODY', value: record.body }],
          },
        ],
      },
    });
  }
}