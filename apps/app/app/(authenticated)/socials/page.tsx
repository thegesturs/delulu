import { Header } from "@/components/layout/header";
import ConnectedAccounts from "@/components/socials/connected-accounts";
import { SocialNotifications } from "@/components/socials/social-notifications";

export const dynamic = "force-dynamic";

export default function NetworkPage() {
  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-background">
      <Header page="Connected Accounts" pages={["Settings"]} />
      <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
        <SocialNotifications />
        <ConnectedAccounts />
      </div>
    </div>
  );
}
