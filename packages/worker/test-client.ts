import type {
  SocialPublishInputType,
  SocialType,
} from '@delulu/validators/post';
import { providerRegistry } from './providers';

export async function processMessageTestOnly(messageBody: string) {
  console.log('Message body', messageBody);
  const { socialPublishInput, socialType } = JSON.parse(messageBody) as {
    socialPublishInput: SocialPublishInputType;
    socialType: SocialType;
  };

  console.log('Social publish input', socialPublishInput);

  if (socialType === 'LENS' || socialType === 'DEFAULT') {
    return;
  }

  const providerImpl = providerRegistry[socialType];
  console.log(providerImpl, 'impl');
  
  // Just call the provider directly without any Convex database operations
  const result = await providerImpl.publish({
    content: socialPublishInput,
    socialProviderId: socialPublishInput.socialProviderId,
  });

  console.log('Provider result:', result?.isOk() ? 'SUCCESS' : result?.isErr() ? 'ERROR' : 'UNDEFINED');
  
  return result;
}