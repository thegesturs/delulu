import { redirect } from "next/navigation";

export const metadata = {
  title: "Webhooks",
  description: "Outbound webhooks for Delulu Social integrations.",
};

/** Outbound webhooks (Svix) are not available yet. */
const WebhooksPage = () => {
  redirect("/");
};

export default WebhooksPage;