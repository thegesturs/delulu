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

  const contentType =
    socialPublishInput.content?.[0]?.media?.length > 1
      ? 'carousel'
      : socialPublishInput.content?.[0]?.media?.[0]?.mediaType === 'VIDEO'
        ? 'video'
        : 'single image';

  if (result?.isOk()) {
    console.log(`✅ ${contentType}, ${result.value.platformPostUrl}`);
    console.log('Provider result: SUCCESS');
  } else if (result?.isErr()) {
    console.log(`❌ ${contentType}, ERROR: ${result.error.message}`);
    console.log('Provider result: ERROR');
  } else {
    console.log(`⚪ ${contentType}, UNDEFINED (no result)`);
    console.log('Provider result: UNDEFINED');
  }

  return result;
}
