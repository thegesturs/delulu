import { postActions, useSelectedSocialProviders } from '@/store/post';
import { api } from '@/trpc/react';
import { Badge } from '@delulu/design-system/components/ui/badge';
import type { SocialType } from '@delulu/validators/post';
import { SocialIcon } from './social-icon';

interface SocialSelectorItemProps {
  socialProvider: SocialType;
  name: string;
  socialId: string;
}

export default function SocialSelector() {
  const { data: connectedAccounts } =
    api.socialProvider.getConnectedAccounts.useQuery();

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-medium text-sm">Select Social Networks</h3>
      <div className="grid grid-cols-2 gap-2">
        {connectedAccounts?.map((account) => (
          <SocialSelectorItem
            key={account.id}
            socialProvider={account.socialType}
            name={account.fullName ?? account.username}
            socialId={account.id}
          />
        ))}
      </div>
    </div>
  );
}

function SocialSelectorItem({
  socialProvider,
  name,
  socialId,
}: SocialSelectorItemProps) {
  const selectedSocialProviders = useSelectedSocialProviders();

  const isSelected = selectedSocialProviders?.some(
    (account) => account.socialId === socialId
  );

  const handleSelect = () => {
    if (isSelected) {
      postActions.removeSocialProvider(socialId);
    } else {
      postActions.addSocialProvider({
        socialId,
        name,
        socialType: socialProvider,
      });
    }
  };

  return (
    <Badge
      size="lg"
      variant={isSelected ? 'blue' : 'outline'}
      onClick={handleSelect}
      className="cursor-pointer text-xs"
    >
      <SocialIcon type={socialProvider} />
      <span className="ml-1">{name}</span>
    </Badge>
  );
}
