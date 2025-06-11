// src/trigger-task.handler.js
import { Resource } from 'sst';
import { task } from 'sst/aws/task';

export async function handler(event) {
  for (const record of event.Records) {
    await task.run(Resource.SocialPostsTask, {
      MESSAGE_BODY: record.body,
    });
  }
}
