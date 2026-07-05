import { processMessage } from "./client";

// ECS/dev entry point: process a single message from MESSAGE_BODY then exit.
// The Lambda SQS path (infrastructure/src/social-post-worker.ts) imports
// `processMessage` from ./client directly — this file just wraps it for the
// container runner. Both share one implementation (no more copy-paste).
const messageBody = process.env.MESSAGE_BODY;

console.log("Message body", messageBody);

if (!messageBody) {
  throw new Error("No MESSAGE_BODY environment variable provided");
}

processMessage(messageBody)
  .then(() => {
    console.log("Message processed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to process message:", error);
    process.exit(1);
  });
