'use client';

import type { ReactNode } from 'react';

type AuthProviderProperties = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProperties) => {
  // Better Auth doesn't need a provider wrapper like Clerk
  // The auth client is configured in client.ts and used directly
  return <>{children}</>;
};
