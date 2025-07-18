import { convexClient } from '@convex-dev/better-auth/client/plugins';
import {
  emailOTPClient,
  genericOAuthClient,
  magicLinkClient,
  twoFactorClient,
} from 'better-auth/client/plugins';
import { nextCookies } from 'better-auth/next-js';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  plugins: [
    nextCookies(),
    convexClient(),
    magicLinkClient(),
    emailOTPClient(),
    twoFactorClient(),
    genericOAuthClient(),
  ],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  forgetPassword,
  resetPassword,
  verifyEmail,
} = authClient;

// Convenience hook for user data
export const useUser = () => {
  const session = useSession();
  return {
    user: session.data?.user || null,
    isLoading: session.isPending,
    isSignedIn: !!session.data?.user,
  };
};

// Components are now in the app layer
