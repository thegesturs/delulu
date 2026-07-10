import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { Resource } from "sst";

const sqs = new SQSClient({});

export async function handler(event: {
  headers: Record<string, string>;
  body?: string;
}) {
  const token = event.headers["x-api-key"] ?? event.headers["X-Api-Key"];
  if (token !== Resource.LAMBDA_SECRET_KEY.value) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }
  if (!(event.body && process.env.QUEUE_URL)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing queue or body" }),
    };
  }
  await sqs.send(
    new SendMessageCommand({
      QueueUrl: process.env.QUEUE_URL,
      MessageBody: event.body,
    })
  );
  return { statusCode: 200, body: JSON.stringify({ queued: true }) };
}
