import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { Resource } from "sst";

const sqs = new SQSClient({});

export async function handler(event: {
  headers: Record<string, string>;
  body: string;
}) {
  const authHeader = event.headers["x-api-key"] ?? event.headers["X-Api-Key"];
  if (authHeader !== Resource.LAMBDA_SECRET_KEY.value) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Unauthorized" }),
    };
  }

  try {
    // Parse and validate the request body
    const messageBody = event.body;
    if (!messageBody) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing request body" }),
      };
    }

    // Send message to SQS
    const result = await sqs.send(
      new SendMessageCommand({
        QueueUrl: Resource.SocialPostsQueue.url,
        MessageBody: messageBody,
      })
    );
    console.log("Message sent to queue successfully", result);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Message sent to queue successfully" }),
    };
  } catch (error) {
    console.error("Error processing request:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
}
