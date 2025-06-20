import { keys } from '@delulu/api/keys';
import type { PostReturnType } from '@delulu/validators/post';

import type { SocialProvider } from './types';

export const threadsProvider: SocialProvider = {
  publish: async (): Promise<PostReturnType> => {
    // TODO: Implement publish logic for Threads
    throw new Error('Not implemented');
  },

  connectUrl: () => {
    const params = new URLSearchParams({
      client_id: keys().THREADS_CLIENT_ID,
      redirect_uri: keys().THREADS_CALLBACK_URL,
      response_type: 'code',
      scope: [
        'threads_basic',
        'threads_content_publish',
        'threads_read_replies',
        'threads_manage_replies',
        'threads_manage_insights',
      ].join(','),
    });

    return `https://threads.net/oauth/authorize?${params.toString()}`;
  },
};
