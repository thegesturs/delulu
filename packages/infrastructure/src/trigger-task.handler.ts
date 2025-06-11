// src/trigger-task.handler.js
import { Resource } from 'sst';
import { task } from 'sst/aws/task';

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export async function handler(event: { Records: any }) {
  for (const record of event.Records) {
    await task.run(Resource.SocialPostsTask, {
      MESSAGE_BODY: record.body,
    });
  }
}
