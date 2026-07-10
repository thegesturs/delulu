// src/trigger-task.handler.js
import { Resource } from "sst";
import { task } from "sst/aws/task";

// biome-ignore lint/suspicious/noExplicitAny: AWS event types are complex
export async function handler(event: { Records: any }) {
  for (const record of event.Records) {
    console.log("Record", record.body);
    const socialPostsTask = (
      Resource as unknown as {
        SocialPostsTask: Parameters<typeof task.run>[0];
      }
    ).SocialPostsTask;
    await task.run(socialPostsTask, { MESSAGE_BODY: record.body });
  }
}
