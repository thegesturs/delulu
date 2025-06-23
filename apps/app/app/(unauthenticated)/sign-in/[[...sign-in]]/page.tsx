import { SignIn } from '@/components/auth/sign-in';
import { createMetadata } from '@delulu/seo/metadata';
import type { Metadata } from 'next';

const title = 'Welcome back';
const description = 'Enter your details to sign in.';

export const metadata: Metadata = createMetadata({ title, description });

type SignInPageProps = {
  searchParams: { redirect_to?: string };
};

const SignInPage = ({ searchParams }: SignInPageProps) => {
  const redirectTo = searchParams.redirect_to;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn redirectTo={redirectTo} />
    </div>
  );
};

export default SignInPage;
