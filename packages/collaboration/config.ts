import { createClient } from '@liveblocks/client';

// Define Liveblocks types for your application
declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
    };

    Storage: {};

    UserMeta: {
      id: string;
      info: {
        name?: string;
        avatar?: string;
        color: string;
      };
    };

    RoomEvent: {};
    ThreadMetadata: {};
    RoomInfo: {};
  }
}

export const createLiveblocksClient = () => {
  return createClient({
    authEndpoint: '/api/collaboration/auth',
    // In Cloudflare Workers, WebSocket is already available globally
    // so we don't need to provide a polyfill
  });
};
