import { postActions, useSelectedSocialProviders } from '@/store/post';
import { Badge } from '@delulu/design-system/components/ui/badge';
import { type SocialType, SocialTypes } from '@delulu/validators/post';
import { SocialIcon } from './social-icon';

interface SocialSelectorItemProps {
  socialProvider: SocialType;
  name: string;
  socialId: string;
}

const mockSocialProviders = [
  {
    id: '1',
    fullName: 'I am Cool',
    username: 'twitter',
    socialType: SocialTypes.TWITTER,
    socialId: 'twitter',
  },
  {
    id: '2',
    fullName: 'I am Cool',
    username: 'instagram',
    socialType: SocialTypes.INSTAGRAM,
    socialId: 'instagram',
  },
  {
    id: '3',
    fullName: 'I am Cool',
    username: 'linkedin',
    socialType: SocialTypes.LINKEDIN,
    socialId: 'linkedin',
  },
  {
    id: '4',
    fullName: 'I am Cool',
    username: 'youtube',
    socialType: SocialTypes.YOUTUBE,
    socialId: 'youtube',
  },
];

export default function SocialSelector() {
  // const { data: connectedAccounts } =
  //   api.socialProvider.getConnectedAccounts.useQuery();

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-medium text-sm">Select Social Networks</h3>
      <div className="grid grid-cols-2 gap-1">
        {mockSocialProviders?.map((account) => (
          <SocialSelectorItem
            key={account.socialId}
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
      className="w-full cursor-pointer text-xs "
    >
      <SocialIcon type={socialProvider} />
      <span className="ml-1">{name}</span>
    </Badge>
  );
}
