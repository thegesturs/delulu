'use client';
import { SignInButton } from '@clerk/nextjs';
import { useAuth } from '@clerk/nextjs';
import { Authenticated, Unauthenticated, useConvexAuth } from 'convex/react';
import type React from 'react';
import { useEffect, useState } from 'react';

export default function ConvexAuthProvider({
  children,
}: { children: React.ReactNode }) {
  const { isLoading: convexLoading, isAuthenticated } = useConvexAuth();
  const { getToken, isLoaded: clerkLoaded, userId } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only try to fetch token when Clerk is loaded
    console.log('>>> userid', userId);
    if (!clerkLoaded) {
      console.log('>>> waiting for clerk to load');
      return;
    }

    const fetchToken = async () => {
      try {
        console.log('>>> fetching token');
        const token = await getToken({ template: 'convex' });
        console.log('>>> token received:', !!token);
        if (!token) {
          console.log('>>> no token received');
        }
      } catch (error) {
        console.error('Error fetching token:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchToken();
  }, [getToken, clerkLoaded]);

  // Show loading state while either Clerk or Convex are initializing
  if (!clerkLoaded || convexLoading || isLoading) {
    return <div>Loading...</div>;
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
