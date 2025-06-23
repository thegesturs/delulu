import { SignUp } from '@/components/auth/sign-up';
import { createMetadata } from '@delulu/seo/metadata';
import type { Metadata } from 'next';

const title = 'Create Account';
const description = 'Create your account to get started.';

export const metadata: Metadata = createMetadata({ title, description });

type SignUpPageProps = {
  searchParams: { redirect_to?: string };
};

const SignUpPage = ({ searchParams }: SignUpPageProps) => {
  const redirectTo = searchParams.redirect_to;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp redirectTo={redirectTo} />
    </div>
  );
};

export default SignUpPage;
