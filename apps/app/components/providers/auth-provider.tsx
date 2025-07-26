'use client';
import { SignInButton } from '@delulu/auth';
import { Authenticated, Unauthenticated, useConvexAuth } from 'convex/react';
import type React from 'react';
import { FaSpinner } from 'react-icons/fa';
export default function ConvexAuthProvider({
  children,
}: { children: React.ReactNode }) {
  const { isLoading: convexLoading, isAuthenticated } = useConvexAuth();

  // Show loading state while either Clerk or Convex are initializing
  if (convexLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <FaSpinner className="animate-spin text-2xl" />
      </div>
    );
  }

  // Only show not authenticated when Clerk is loaded and we're sure we're not authenticated
  if (!isAuthenticated) {
    return <div>Not authenticated</div>;
  }

  return <>{children}</>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Authenticated>
        <ConvexAuthProvider>{children}</ConvexAuthProvider>
      </Authenticated>
      <Unauthenticated>
        <SignInButton />
      </Unauthenticated>
    </>
  );
}
