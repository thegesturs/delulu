import ConnectedAccounts from '@/components/socials/connected-accounts';
import { SocialNotifications } from '@/components/socials/social-notifications';

export const dynamic = 'force-dynamic';

export default function NetworkPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl p-6">
        <SocialNotifications />
        <ConnectedAccounts />
      </div>
    </div>
  );
}
